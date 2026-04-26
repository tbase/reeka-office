import { defineConfig } from "drizzle-kit"

import { config } from "dotenv"

config({ path: "drizzle/.env.local" })
config({ path: `drizzle/.env.local.${process.env.TENANT_CODE}` })

export default defineConfig({
  schema: [
    "./apps/admin/src/db/schema.ts",
    "./packages/domain-agent/src/db/schema/index.ts",
    "./packages/domain-cms/src/db/schema.ts",
    "./packages/domain-crm/src/db/schema/index.ts",
    "./packages/domain-performance/src/db/schema/index.ts",
    "./packages/domain-point/src/db/schema.ts",
    "./packages/domain-plan/src/db/schema.ts",
  ],
  out: "./drizzle/business",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT ?? "3306", 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
})
