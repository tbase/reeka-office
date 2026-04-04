import { format } from "date-fns"
import { and, eq } from "drizzle-orm"
import puppeteer, { type Browser } from "puppeteer"

import { getDB } from "@/db"
import { externalSessionCache } from "@/db/schema"

const PRU_PROVIDER = "pru-hk"
const DEFAULT_LOGIN_URL = "https://salesforce.prudential.com.hk/sap/login"
const DEFAULT_COOKIE_URL = "https://aes.prudential.com.hk/aes/AESServlet?type=iPC"
const DEFAULT_COOKIE_TTL_MINUTES = 12
const DEFAULT_BROWSER_TIMEOUT_MS = 30_000

interface PruRuntimeConfig {
  provider: string
  username: string
  password: string
  loginUrl: string
  cookieUrl: string
  cookieTtlMinutes: number
  browserTimeoutMs: number
}

export interface PruCookieStatus {
  provider: string
  accountLabel: string | null
  loginUrl: string
  cookieUrl: string
  ready: boolean
  missing: string[]
  cache: {
    cookieCount: number
    expiresAt: string
    updatedAt: string
    isExpired: boolean
  } | null
}

interface RefreshPruCookieOptions {
  adminId?: string
}

interface CachedSessionRecord {
  cookieString: string
  cookieCount: number
  expiresAt: string
  updatedAt: string
}

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]
  if (typeof value !== "string") {
    return null
  }

  const text = value.trim()
  return text ? text : null
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const raw = readOptionalEnv(name)
  if (!raw) {
    return fallback
  }

  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function formatMySqlDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd HH:mm:ss")
}

function maskAccount(value: string | null): string | null {
  if (!value) {
    return null
  }

  if (value.length <= 4) {
    return `${value[0] ?? "*"}***`
  }

  return `${value.slice(0, 2)}***${value.slice(-2)}`
}

function buildSessionId(provider: string, accountKey: string): string {
  return `${provider}:${accountKey}`
}

function getPruRuntimeConfig(): PruRuntimeConfig {
  const username = readOptionalEnv("PRU_USERNAME")
  const password = readOptionalEnv("PRU_PASSWORD")
  const missing: string[] = []

  if (!username) {
    missing.push("PRU_USERNAME")
  }

  if (!password) {
    missing.push("PRU_PASSWORD")
  }

  if (missing.length > 0) {
    throw new Error(`PRU 登录配置缺失：${missing.join("、")}`)
  }

  return {
    provider: PRU_PROVIDER,
    username: username!,
    password: password!,
    loginUrl: readOptionalEnv("PRU_LOGIN_URL") ?? DEFAULT_LOGIN_URL,
    cookieUrl: readOptionalEnv("PRU_COOKIE_URL") ?? DEFAULT_COOKIE_URL,
    cookieTtlMinutes: readPositiveIntegerEnv(
      "PRU_COOKIE_TTL_MINUTES",
      DEFAULT_COOKIE_TTL_MINUTES,
    ),
    browserTimeoutMs: readPositiveIntegerEnv(
      "PRU_BROWSER_TIMEOUT_MS",
      DEFAULT_BROWSER_TIMEOUT_MS,
    ),
  }
}

function getPruConfigStatus(): Pick<
  PruCookieStatus,
  "provider" | "accountLabel" | "loginUrl" | "cookieUrl" | "ready" | "missing"
> {
  const username = readOptionalEnv("PRU_USERNAME")
  const password = readOptionalEnv("PRU_PASSWORD")
  const missing: string[] = []

  if (!username) {
    missing.push("PRU_USERNAME")
  }

  if (!password) {
    missing.push("PRU_PASSWORD")
  }

  return {
    provider: PRU_PROVIDER,
    accountLabel: maskAccount(username),
    loginUrl: readOptionalEnv("PRU_LOGIN_URL") ?? DEFAULT_LOGIN_URL,
    cookieUrl: readOptionalEnv("PRU_COOKIE_URL") ?? DEFAULT_COOKIE_URL,
    ready: missing.length === 0,
    missing,
  }
}

async function findCachedSession(
  provider: string,
  accountKey: string,
): Promise<CachedSessionRecord | null> {
  const db = getDB()
  const [record] = await db
    .select({
      cookieString: externalSessionCache.cookieString,
      cookieCount: externalSessionCache.cookieCount,
      expiresAt: externalSessionCache.expiresAt,
      updatedAt: externalSessionCache.updatedAt,
    })
    .from(externalSessionCache)
    .where(
      and(
        eq(externalSessionCache.provider, provider),
        eq(externalSessionCache.accountKey, accountKey),
      ),
    )
    .limit(1)

  return record ?? null
}

function isExpired(expiresAt: string, now = new Date()): boolean {
  return expiresAt <= formatMySqlDateTime(now)
}

async function openBrowser(config: PruRuntimeConfig): Promise<Browser> {
  return puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
    timeout: config.browserTimeoutMs,
  })
}

async function collectCookies(
  browser: Browser,
  config: PruRuntimeConfig,
): Promise<Array<{ name: string; value: string; expires?: number }>> {
  const page = await browser.newPage()

  try {
    await page.goto(config.loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: config.browserTimeoutMs,
    })

    await page.waitForSelector('input[name="username"]', {
      visible: true,
      timeout: config.browserTimeoutMs,
    })
    await page.type('input[name="username"]', config.username)
    await page.type('input[name="password"]', config.password)
    await Promise.all([
      page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: config.browserTimeoutMs,
      }).catch(() => null),
      page.click("#submit"),
    ])

    await page.waitForNetworkIdle({
      timeout: config.browserTimeoutMs,
    }).catch(() => null)

    await page.goto(config.cookieUrl, {
      waitUntil: "networkidle2",
      timeout: config.browserTimeoutMs,
    })

    return page.cookies(config.loginUrl, config.cookieUrl)
  } finally {
    await page.close().catch(() => null)
  }
}

function buildCookieString(cookies: Array<{ name: string; value: string }>): string {
  return cookies
    .filter((cookie) => cookie.name && cookie.value)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")
}

function resolveExpiry(
  cookies: Array<{ expires?: number }>,
  fallbackMinutes: number,
): string {
  const fallbackAt = new Date(Date.now() + fallbackMinutes * 60 * 1000)
  const cookieExpirations = cookies
    .map((cookie) => cookie.expires)
    .filter((value) => value && Number.isFinite(value) && value > 0)
    .map((value) => new Date(value! * 1000))

  if (cookieExpirations.length === 0) {
    return formatMySqlDateTime(fallbackAt)
  }

  const earliestCookieExpiry = new Date(
    Math.min(...cookieExpirations.map((value) => value.getTime())),
  )

  return formatMySqlDateTime(
    earliestCookieExpiry.getTime() < fallbackAt.getTime()
      ? earliestCookieExpiry
      : fallbackAt,
  )
}

export async function getPruCookieStatus(): Promise<PruCookieStatus> {
  const config = getPruConfigStatus()

  if (!config.accountLabel) {
    return {
      ...config,
      cache: null,
    }
  }

  const cache = await findCachedSession(config.provider, readOptionalEnv("PRU_USERNAME")!)

  return {
    ...config,
    cache: cache
      ? {
        cookieCount: cache.cookieCount,
        expiresAt: cache.expiresAt,
        updatedAt: cache.updatedAt,
        isExpired: isExpired(cache.expiresAt),
      }
      : null,
  }
}

export async function refreshPruCookie(
  options: RefreshPruCookieOptions = {},
): Promise<PruCookieStatus["cache"]> {
  const config = getPruRuntimeConfig()
  const browser = await openBrowser(config)

  try {
    const cookies = await collectCookies(browser, config)
    const cookieString = buildCookieString(cookies)

    if (!cookieString) {
      throw new Error("未获取到有效 Cookie，请确认账号密码和页面选择器是否仍然有效")
    }

    const now = formatMySqlDateTime(new Date())
    const expiresAt = resolveExpiry(cookies, config.cookieTtlMinutes)

    await getDB()
      .insert(externalSessionCache)
      .values({
        id: buildSessionId(config.provider, config.username),
        provider: config.provider,
        accountKey: config.username,
        accountLabel: maskAccount(config.username),
        cookieString,
        cookieCount: cookies.length,
        expiresAt,
        createdAt: now,
        updatedAt: now,
        updatedByAdminId: options.adminId ?? null,
      })
      .onDuplicateKeyUpdate({
        set: {
          accountLabel: maskAccount(config.username),
          cookieString,
          cookieCount: cookies.length,
          expiresAt,
          updatedAt: now,
          updatedByAdminId: options.adminId ?? null,
        },
      })

    return {
      cookieCount: cookies.length,
      expiresAt,
      updatedAt: now,
      isExpired: false,
    }
  } finally {
    await browser.close().catch(() => null)
  }
}

export async function getPruCookieString(): Promise<string> {
  const config = getPruRuntimeConfig()
  const cache = await findCachedSession(config.provider, config.username)

  if (cache && !isExpired(cache.expiresAt)) {
    return cache.cookieString
  }

  await refreshPruCookie()

  const refreshed = await findCachedSession(config.provider, config.username)
  if (!refreshed?.cookieString) {
    throw new Error("PRU Cookie 刷新成功后未能读取缓存")
  }

  return refreshed.cookieString
}
