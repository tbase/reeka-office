import { hashPassword } from "better-auth/crypto"
import { config } from "dotenv"
import { tenants as identityTenants } from "@reeka-office/domain-identity"
import { and, eq } from "drizzle-orm"
import { formatISO9075 } from "date-fns"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { stdin as input, stdout as output } from "node:process"
import { createInterface, type Interface } from "node:readline/promises"
import { fileURLToPath } from "node:url"

import { closeDB, getDB } from "../src/db"
import { closeIdentityDB, getIdentityDB } from "../src/db/identity"
import * as schema from "../src/db/schema"
import { auth } from "../src/lib/auth"

type ParsedArgs = {
  positionals: string[]
  flags: Map<string, string | boolean>
}

type AdminCreateOptions = {
  email: string
  password: string
  adminName: string
}

type TenantCreateOptions = {
  tenantCode: string
  tenantName: string
  adminDomain: string
  apiServiceName: string
  status: "active" | "disabled"
  writeEnvFiles: boolean
  forceEnvFiles: boolean
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(SCRIPT_DIR, "../../..")
const LOCAL_ENV_ROOT = join(REPO_ROOT, "env", "local")
const TENANT_ENV_ROOT = join(LOCAL_ENV_ROOT, "tenants")

function loadEnv() {
  config({ path: ".env.local" })
  config()
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = []
  const flags = new Map<string, string | boolean>()

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === "-h") {
      flags.set("help", true)
      continue
    }

    if (!token.startsWith("--")) {
      positionals.push(token)
      continue
    }

    const withoutPrefix = token.slice(2)
    const equalIndex = withoutPrefix.indexOf("=")
    if (equalIndex >= 0) {
      flags.set(withoutPrefix.slice(0, equalIndex), withoutPrefix.slice(equalIndex + 1))
      continue
    }

    const nextToken = argv[index + 1]
    if (nextToken && !nextToken.startsWith("--")) {
      flags.set(withoutPrefix, nextToken)
      index += 1
      continue
    }

    flags.set(withoutPrefix, true)
  }

  return { positionals, flags }
}

function getFlag(args: ParsedArgs, ...names: string[]): string | boolean | undefined {
  for (const name of names) {
    if (args.flags.has(name)) {
      return args.flags.get(name)
    }
  }

  return undefined
}

function getFlagString(args: ParsedArgs, ...names: string[]): string | undefined {
  const value = getFlag(args, ...names)
  return typeof value === "string" ? value.trim() : undefined
}

function hasFlag(args: ParsedArgs, ...names: string[]): boolean {
  return Boolean(getFlag(args, ...names))
}

function isInteractive() {
  return input.isTTY && output.isTTY
}

function ensureValue(value: string | undefined, message: string): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    throw new Error(message)
  }

  return trimmed
}

function normalizeEmail(value: string | undefined): string {
  return ensureValue(value, "Admin email is required").toLowerCase()
}

function normalizeTenantCode(value: string | undefined): string {
  const tenantCode = ensureValue(value, "Tenant code is required").toLowerCase()

  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(tenantCode)) {
    throw new Error("Tenant code must match /^[a-z0-9][a-z0-9-]{0,31}$/")
  }

  return tenantCode
}

function normalizeStatus(value: string | undefined): "active" | "disabled" {
  const normalized = value?.trim().toLowerCase()
  if (!normalized || normalized === "active") {
    return "active"
  }

  if (normalized === "disabled") {
    return "disabled"
  }

  throw new Error("Tenant status must be active or disabled")
}

async function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isInteractive()) {
      reject(new Error("Interactive terminal is required"))
      return
    }

    output.write(question)
    input.resume()
    input.setRawMode(true)
    input.setEncoding("utf8")

    let value = ""

    const onData = (chunk: string) => {
      if (chunk === "\r" || chunk === "\n") {
        output.write("\n")
        input.setRawMode(false)
        input.pause()
        input.removeListener("data", onData)
        resolve(value)
        return
      }

      if (chunk === "\u0003") {
        output.write("\n")
        input.setRawMode(false)
        input.pause()
        input.removeListener("data", onData)
        reject(new Error("Input cancelled"))
        return
      }

      if (chunk === "\u007f") {
        if (value.length > 0) {
          value = value.slice(0, -1)
          output.write("\b \b")
        }
        return
      }

      value += chunk
      output.write("*")
    }

    input.on("data", onData)
  })
}

async function withPrompter<T>(callback: (rl: Interface) => Promise<T>): Promise<T> {
  const rl = createInterface({ input, output })

  try {
    return await callback(rl)
  } finally {
    rl.close()
  }
}

async function promptForValue(rl: Interface, question: string, value?: string): Promise<string> {
  const trimmed = value?.trim()
  if (trimmed) {
    return trimmed
  }

  if (!isInteractive()) {
    throw new Error(`${question.replace(/: $/, "")} is required`)
  }

  return ensureValue(await rl.question(question), `${question.replace(/: $/, "")} is required`)
}

async function collectAdminCreateOptions(args: ParsedArgs): Promise<AdminCreateOptions> {
  return withPrompter(async (rl) => {
    const email = normalizeEmail(await promptForValue(rl, "Admin email: ", getFlagString(args, "email")))

    let password = getFlagString(args, "password")
    if (!password) {
      if (!isInteractive()) {
        throw new Error("Admin password is required")
      }
      password = ensureValue(await promptHidden("Admin password: "), "Admin password is required")
    }

    if (password.length < 8) {
      throw new Error("Admin password must be at least 8 characters")
    }

    const adminName =
      getFlagString(args, "admin-name", "name") ?? process.env.ADMIN_NAME?.trim() ?? "Administrator"

    return {
      email,
      password,
      adminName,
    }
  })
}

async function collectTenantCreateOptions(args: ParsedArgs): Promise<TenantCreateOptions> {
  return withPrompter(async (rl) => {
    const tenantCode = normalizeTenantCode(
      await promptForValue(rl, "Tenant code: ", getFlagString(args, "tenant-code", "code")),
    )
    const tenantName = ensureValue(
      await promptForValue(rl, "Tenant name: ", getFlagString(args, "tenant-name", "name")),
      "Tenant name is required",
    )
    const adminDomain = ensureValue(
      await promptForValue(rl, "Admin domain: ", getFlagString(args, "admin-domain")),
      "Admin domain is required",
    )
    const apiServiceName = ensureValue(
      getFlagString(args, "api-service-name") ?? `reeka-office-api-${tenantCode}`,
      "API service name is required",
    )
    const status = normalizeStatus(getFlagString(args, "status"))

    return {
      tenantCode,
      tenantName,
      adminDomain,
      apiServiceName,
      status,
      writeEnvFiles: !hasFlag(args, "no-env-files"),
      forceEnvFiles: hasFlag(args, "force-env-files"),
    }
  })
}

async function createOrUpdateAdmin(options: AdminCreateOptions) {
  const db = getDB()
  const existingUser = await db.query.admin.findFirst({
    where: eq(schema.admin.email, options.email),
  })

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        email: options.email,
        password: options.password,
        name: options.adminName,
      },
    })

    console.log(`Created admin account: ${options.email}`)
    return
  }

  const passwordHash = await hashPassword(options.password)
  const result = await db
    .update(schema.adminAccount)
    .set({
      password: passwordHash,
      updatedAt: formatISO9075(new Date()),
    })
    .where(
      and(
        eq(schema.adminAccount.userId, existingUser.id),
        eq(schema.adminAccount.providerId, "credential"),
      ),
    )

  if (result[0].affectedRows === 0) {
    throw new Error(`Admin user exists but credential account is missing for ${options.email}`)
  }

  await db
    .update(schema.admin)
    .set({
      name: options.adminName,
      updatedAt: formatISO9075(new Date()),
    })
    .where(eq(schema.admin.id, existingUser.id))

  console.log(`Updated admin account: ${options.email}`)
}

async function createAdminCommand(args: ParsedArgs) {
  const options = await collectAdminCreateOptions(args)
  await createOrUpdateAdmin(options)
}

async function writeEnvTemplateFile(
  path: string,
  content: string,
  force: boolean,
): Promise<"created" | "updated" | "skipped"> {
  try {
    await readFile(path, "utf8")
    if (!force) {
      return "skipped"
    }
  } catch {
    // file does not exist
  }

  await writeFile(path, content, "utf8")
  return force ? "updated" : "created"
}

function createTenantAdminEnvTemplate(options: TenantCreateOptions): string {
  return [
    `TENANT_CODE=${options.tenantCode}`,
    `DB_HOST=`,
    `DB_PORT=3306`,
    `DB_USER=`,
    `DB_PASSWORD=`,
    `DB_NAME=`,
    ``,
    `CENTER_DB_HOST=${process.env.CENTER_DB_HOST ?? process.env.DB_HOST ?? ""}`,
    `CENTER_DB_PORT=${process.env.CENTER_DB_PORT ?? process.env.DB_PORT ?? "3306"}`,
    `CENTER_DB_USER=${process.env.CENTER_DB_USER ?? process.env.DB_USER ?? ""}`,
    `CENTER_DB_PASSWORD=${process.env.CENTER_DB_PASSWORD ?? process.env.DB_PASSWORD ?? ""}`,
    `CENTER_DB_NAME=${process.env.CENTER_DB_NAME ?? process.env.DB_NAME ?? ""}`,
    ``,
    `COS_BUCKET=${process.env.COS_BUCKET ?? ""}`,
    ``,
  ].join("\n")
}

function createTenantApiEnvTemplate(options: TenantCreateOptions): string {
  return [
    `TENANT_CODE=${options.tenantCode}`,
    `DB_HOST=`,
    `DB_PORT=3306`,
    `DB_USER=`,
    `DB_PASSWORD=`,
    `DB_NAME=`,
    ``,
    `CENTER_DB_HOST=${process.env.CENTER_DB_HOST ?? process.env.DB_HOST ?? ""}`,
    `CENTER_DB_PORT=${process.env.CENTER_DB_PORT ?? process.env.DB_PORT ?? "3306"}`,
    `CENTER_DB_USER=${process.env.CENTER_DB_USER ?? process.env.DB_USER ?? ""}`,
    `CENTER_DB_PASSWORD=${process.env.CENTER_DB_PASSWORD ?? process.env.DB_PASSWORD ?? ""}`,
    `CENTER_DB_NAME=${process.env.CENTER_DB_NAME ?? process.env.DB_NAME ?? ""}`,
    ``,
  ].join("\n")
}

async function ensureTenantEnvFiles(options: TenantCreateOptions): Promise<void> {
  const tenantDir = join(TENANT_ENV_ROOT, options.tenantCode)
  await mkdir(tenantDir, { recursive: true })

  const adminEnvPath = join(tenantDir, "admin.env.local")
  const apiEnvPath = join(tenantDir, "api.env.local")

  const adminResult = await writeEnvTemplateFile(
    adminEnvPath,
    createTenantAdminEnvTemplate(options),
    options.forceEnvFiles,
  )
  const apiResult = await writeEnvTemplateFile(
    apiEnvPath,
    createTenantApiEnvTemplate(options),
    options.forceEnvFiles,
  )

  console.log(`Env template ${adminResult}: ${adminEnvPath}`)
  console.log(`Env template ${apiResult}: ${apiEnvPath}`)
}

async function createOrUpdateTenant(options: TenantCreateOptions) {
  const db = getIdentityDB()
  const existingTenant = await db.query.tenants.findFirst({
    where: eq(identityTenants.tenantCode, options.tenantCode),
  })

  if (!existingTenant) {
    await db.insert(identityTenants).values({
      tenantCode: options.tenantCode,
      tenantName: options.tenantName,
      adminDomain: options.adminDomain,
      apiServiceName: options.apiServiceName,
      status: options.status,
    })

    console.log(`Created tenant: ${options.tenantCode}`)
  } else {
    await db
      .update(identityTenants)
      .set({
        tenantName: options.tenantName,
        adminDomain: options.adminDomain,
        apiServiceName: options.apiServiceName,
        status: options.status,
      })
      .where(eq(identityTenants.tenantCode, options.tenantCode))

    console.log(`Updated tenant: ${options.tenantCode}`)
  }

  if (options.writeEnvFiles) {
    await ensureTenantEnvFiles(options)
  }
}

async function createTenantCommand(args: ParsedArgs) {
  const options = await collectTenantCreateOptions(args)
  await createOrUpdateTenant(options)
}

function printHelp() {
  console.log(`
Usage:
  pnpm --filter admin super -- admin create --email <email> --password <password>
  pnpm --filter admin super -- tenant create --tenant-code <code> --tenant-name <name> --admin-domain <domain>

Commands:
  admin create      Create or update an admin account
  tenant create     Create or update a tenant in the center identity database

Options:
  --admin-name      Admin display name
  --admin-domain    Tenant admin domain
  --api-service-name Tenant API service name (default: reeka-office-api-<tenant-code>)
  --code            Alias of --tenant-code
  --email           Admin email
  --force-env-files Overwrite existing env template files
  --name            Alias of --tenant-name
  --no-env-files    Do not write env template files under env/local/tenants/<tenant-code>
  --password        Admin password
  --status          Tenant status: active | disabled
  --tenant-code     Tenant code
  --tenant-name     Tenant display name
  -h, --help        Show this help message
`.trim())
}

async function main() {
  loadEnv()

  const args = parseArgs(process.argv.slice(2))
  const [scope, action] = args.positionals

  if (hasFlag(args, "help") || !scope) {
    printHelp()
    return
  }

  if (scope === "admin" && action === "create") {
    await createAdminCommand(args)
    return
  }

  if (scope === "tenant" && action === "create") {
    await createTenantCommand(args)
    return
  }

  throw new Error(`Unknown command: ${args.positionals.join(" ")}`)
}

main()
  .catch((error) => {
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error("super-cli failed")
    }
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDB()
    await closeIdentityDB()
  })
