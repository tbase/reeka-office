import { hashPassword } from "better-auth/crypto"
import { config } from "dotenv"
import { and, eq } from "drizzle-orm"
import { formatISO9075 } from "date-fns"
import { stdin as input, stdout as output } from "node:process"
import { createInterface, type Interface } from "node:readline/promises"

import { closeDB, getDB } from "../src/db"
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

function printHelp() {
  console.log(`
Usage:
  pnpm --filter admin super -- admin create --email <email> --password <password>

Commands:
  admin create      Create or update an admin account

Options:
  --admin-name      Admin display name
  --email           Admin email
  --password        Admin password
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
