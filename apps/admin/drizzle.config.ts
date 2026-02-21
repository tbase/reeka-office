import { defineConfig } from "drizzle-kit";
import { config } from 'dotenv'

config({ path: '.env.local' })

export default defineConfig({
  schema: [
    "./src/db/schema.ts",
    "../../packages/domain-cms/src/db/schema.ts",
    "../../packages/domain-point/src/db/schema.ts",
  ],
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
});
