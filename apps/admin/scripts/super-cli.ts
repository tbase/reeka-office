import { hashPassword } from "better-auth/crypto"
import { config } from "dotenv"
import { and, eq } from "drizzle-orm"
import { formatISO9075 } from "date-fns"
import mysql, { type ResultSetHeader, type RowDataPacket } from "mysql2/promise"
import { stdin as input, stdout as output } from "node:process"
import { createInterface, type Interface } from "node:readline/promises"

import { closeDB, getDB, getDBConfig } from "../src/db"
import * as schema from "../src/db/schema"
import { auth } from "../src/lib/auth"

type ParsedArgs = {
  positionals: string[]
  flags: Map<string, string | boolean>
}

type TenantRecord = {
  id: number
  name: string
}

type AdminCreateOptions = {
  email: string
  password: string
  tenantId: number
  adminName: string
  allowTenantTransfer: boolean
}

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
      const key = withoutPrefix.slice(0, equalIndex)
      const value = withoutPrefix.slice(equalIndex + 1)
      flags.set(key, value)
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

function parsePositiveInt(value: string | undefined, label: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }

  return parsed
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

async function promptForValue(
  rl: Interface,
  question: string,
  value?: string,
): Promise<string> {
  const trimmed = value?.trim()
  if (trimmed) {
    return trimmed
  }

  if (!isInteractive()) {
    throw new Error(`${question.replace(/: $/, "")} is required`)
  }

  return ensureValue(await rl.question(question), `${question.replace(/: $/, "")} is required`)
}

function getRequiredDBConfig() {
  const dbConfig = getDBConfig()
  const missing = [
    !dbConfig.host && "DB_HOST",
    !dbConfig.user && "DB_USER",
    dbConfig.password === undefined && "DB_PASSWORD",
    !dbConfig.database && "DB_NAME",
  ].filter(Boolean)

  if (missing.length > 0) {
    throw new Error(`Missing database config: ${missing.join(", ")}`)
  }

  return dbConfig
}

async function createConnection() {
  return mysql.createConnection(getRequiredDBConfig())
}

async function getTenantById(id: number): Promise<TenantRecord | null> {
  const connection = await createConnection()

  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      "select `id`, `name` from tenants where `id` = ? limit 1",
      [id],
    )
    const row = rows[0] as TenantRecord | undefined
    return row ?? null
  } finally {
    await connection.end()
  }
}

async function getTenantByName(name: string): Promise<TenantRecord | null> {
  const connection = await createConnection()

  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      "select `id`, `name` from tenants where `name` = ? order by `id` asc limit 1",
      [name],
    )
    const row = rows[0] as TenantRecord | undefined
    return row ?? null
  } finally {
    await connection.end()
  }
}

async function listTenantRecords(): Promise<TenantRecord[]> {
  const connection = await createConnection()

  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      "select `id`, `name` from tenants order by `id` asc",
    )

    return rows as TenantRecord[]
  } finally {
    await connection.end()
  }
}

async function createTenantRecord(name: string): Promise<TenantRecord> {
  const connection = await createConnection()

  try {
    const [result] = await connection.execute<ResultSetHeader>(
      "insert into tenants (`name`, `status`) values (?, 'active')",
      [name],
    )

    if (!result.insertId) {
      throw new Error("Failed to create tenant")
    }

    return {
      id: result.insertId,
      name,
    }
  } finally {
    await connection.end()
  }
}

async function resolveTenantForAdmin(args: ParsedArgs, rl: Interface): Promise<TenantRecord> {
  const tenantIdRaw = getFlagString(args, "tenant-id")
  const tenantNameArg = getFlagString(args, "tenant-name")

  if (tenantIdRaw && tenantNameArg) {
    throw new Error("Use either --tenant-id or --tenant-name, not both")
  }

  if (tenantIdRaw) {
    const tenant = await getTenantById(parsePositiveInt(tenantIdRaw, "Tenant ID"))
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantIdRaw}`)
    }
    return tenant
  }

  const tenantName = await promptForValue(rl, "Tenant name: ", tenantNameArg)
  const existingTenant = await getTenantByName(tenantName)

  if (existingTenant) {
    return existingTenant
  }

  throw new Error(`Tenant not found: ${tenantName}`)
}

async function collectTenantName(args: ParsedArgs): Promise<string> {
  const argName = getFlagString(args, "name") ?? args.positionals.slice(2).join(" ").trim()

  return withPrompter(async (rl) => promptForValue(rl, "Tenant name: ", argName))
}

async function createTenantCommand(args: ParsedArgs) {
  const tenantName = await collectTenantName(args)
  const tenant = await createTenantRecord(tenantName)

  console.log(`Created tenant: ${tenant.name} (#${tenant.id})`)
}

async function listTenantsCommand() {
  const tenants = await listTenantRecords()

  if (tenants.length === 0) {
    console.log("No tenants found")
    return
  }

  for (const tenant of tenants) {
    console.log(`${tenant.id}\t${tenant.name}`)
  }
}

async function collectAdminCreateOptions(args: ParsedArgs): Promise<AdminCreateOptions> {
  if (hasFlag(args, "create-tenant")) {
    throw new Error("`admin create` no longer supports --create-tenant")
  }

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

    const tenant = await resolveTenantForAdmin(args, rl)
    const adminName =
      getFlagString(args, "admin-name", "name") ?? process.env.ADMIN_NAME?.trim() ?? "Administrator"

    return {
      email,
      password,
      tenantId: tenant.id,
      adminName,
      allowTenantTransfer: hasFlag(args, "allow-tenant-transfer"),
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
        tenantId: options.tenantId,
      },
    })

    await db
      .update(schema.admin)
      .set({
        tenantId: options.tenantId,
        updatedAt: formatISO9075(new Date()),
      })
      .where(eq(schema.admin.email, options.email))

    console.log(`Created admin account: ${options.email} (tenant #${options.tenantId})`)
    return
  }

  if (existingUser.tenantId !== options.tenantId && !options.allowTenantTransfer) {
    throw new Error(
      `Admin ${options.email} already belongs to tenant #${existingUser.tenantId}. ` +
        "Pass --allow-tenant-transfer to move it.",
    )
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
      tenantId: options.tenantId,
      updatedAt: formatISO9075(new Date()),
    })
    .where(eq(schema.admin.id, existingUser.id))

  console.log(`Updated admin account: ${options.email} (tenant #${options.tenantId})`)
}

async function createAdminCommand(args: ParsedArgs) {
  const options = await collectAdminCreateOptions(args)
  await createOrUpdateAdmin(options)
}

async function bootstrapCommand(args: ParsedArgs) {
  const tenantNameArg = getFlagString(args, "tenant-name") ?? getFlagString(args, "tenant")

  const bootstrapInput = await withPrompter(async (rl) => {
    const tenantName = await promptForValue(rl, "Tenant name: ", tenantNameArg)
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

    return {
      tenantName,
      email,
      password,
      adminName:
        getFlagString(args, "admin-name", "name") ?? process.env.ADMIN_NAME?.trim() ?? "Administrator",
    }
  })

  const existingTenant = await getTenantByName(bootstrapInput.tenantName)
  if (existingTenant) {
    throw new Error(
      `Tenant already exists: ${bootstrapInput.tenantName} (#${existingTenant.id}). ` +
        "Use `admin create --tenant-id` to add an admin to it.",
    )
  }

  const tenant = await createTenantRecord(bootstrapInput.tenantName)
  console.log(`Created tenant: ${tenant.name} (#${tenant.id})`)

  await createOrUpdateAdmin({
    email: bootstrapInput.email,
    password: bootstrapInput.password,
    tenantId: tenant.id,
    adminName: bootstrapInput.adminName,
    allowTenantTransfer: false,
  })
}

function printHelp() {
  console.log(`
Usage:
  pnpm --filter admin super:cli -- tenant create --name <tenant-name>
  pnpm --filter admin super:cli -- tenant list
  pnpm --filter admin super:cli -- admin create --email <email> --password <password> --tenant-id <id>
  pnpm --filter admin super:cli -- bootstrap --tenant-name <name> --email <email> --password <password>

Commands:
  tenant create     Create a tenant
  tenant list       List all tenants
  admin create      Create or update a tenant admin
  bootstrap         Create a new tenant and its first admin

Options:
  --name                    Tenant name for \`tenant create\`
  --admin-name              Admin display name for admin commands
  --tenant-id               Existing tenant ID
  --tenant-name             Existing tenant name, or new tenant name for \`bootstrap\`
  --allow-tenant-transfer   Reassign an existing admin email to another tenant
  --email                   Admin email
  --password                Admin password
  -h, --help                Show this help message
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

  if (scope === "bootstrap") {
    await bootstrapCommand(args)
    return
  }

  if (scope === "tenant" && action === "create") {
    await createTenantCommand(args)
    return
  }

  if (scope === "tenant" && action === "list") {
    await listTenantsCommand()
    return
  }

  if (scope === "admin" && action === "create") {
    await createAdminCommand(args)
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
  })
