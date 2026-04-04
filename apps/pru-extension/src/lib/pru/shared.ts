import { getCookiesForUrl } from "@/lib/chrome"
import { AGENT_CODE_PATTERN, AES_ENDPOINT, AES_URL, SALESFORCE_URL } from "@/lib/pru/contract"

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function unique<T>(items: T[]) {
  return [...new Set(items)]
}

export function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html")
}

export function textContent(node: Element | null | undefined) {
  return node?.textContent?.trim() ?? ""
}

export function normalizeAgentCode(value: string) {
  const normalized = value.trim()
  return AGENT_CODE_PATTERN.test(normalized) ? normalized : ""
}

export function parseMetric(text: string, factor = 100) {
  const normalized = text.replaceAll(",", "").trim()
  const numeric = Number(normalized)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.ceil(numeric * factor)
}

export function parseStoredMetric(text: string) {
  const numeric = Number(text.trim())
  return Number.isFinite(numeric) ? numeric : 0
}

function getCombinedCookieHeader(cookies: chrome.cookies.Cookie[]) {
  return cookies
    .filter((cookie) => cookie.name && cookie.value)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")
}

export async function fetchAesHtml(
  purpose: string,
  data: Record<string, string>,
  retryCount = 0,
): Promise<string> {
  const [aesCookies, salesforceCookies] = await Promise.all([
    getCookiesForUrl(AES_URL),
    getCookiesForUrl(SALESFORCE_URL),
  ])
  const cookieHeader = getCombinedCookieHeader([...aesCookies, ...salesforceCookies])

  if (!cookieHeader) {
    throw new Error("未读取到 PRU Cookie，请先在当前 Chrome Profile 中登录 AES 和 Salesforce")
  }

  const response = await fetch(`${AES_ENDPOINT}&purpose=${purpose}`, {
    method: "POST",
    body: new URLSearchParams(data),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Cookie: cookieHeader,
    },
    redirect: "manual",
  })

  if (response.status === 0 || response.type === "opaqueredirect") {
    throw new Error("登录状态已失效，请重新登录 PRU")
  }

  const html = await response.text()

  if (html.includes("Error : 32")) {
    if (retryCount >= 2) {
      throw new Error(`PRU 页面返回异常，重试失败: ${purpose}`)
    }

    await sleep(500)
    return fetchAesHtml(purpose, data, retryCount + 1)
  }

  return html
}
