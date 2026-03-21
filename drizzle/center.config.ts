import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: "drizzle/.env.local", override: true })

export default defineConfig({
  schema: [
    "./packages/domain-identity/src/db/schema.ts",
  ],
  out: "./drizzle/identity",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.CENTER_DB_HOST ?? process.env.DB_HOST!,
    port: parseInt(process.env.CENTER_DB_PORT ?? process.env.DB_PORT ?? "3306", 10),
    user: process.env.CENTER_DB_USER ?? process.env.DB_USER!,
    password: process.env.CENTER_DB_PASSWORD ?? process.env.DB_PASSWORD!,
    database: process.env.CENTER_DB_NAME!,
  },
})
