export const config = {
  server: {
    port: Number(process.env.PORT) || 3010,
    hostname: process.env.HOSTNAME || '0.0.0.0',
  },
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
} as const
