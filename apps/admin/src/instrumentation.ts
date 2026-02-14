export async function register() {
  const { setup } = await import("@reeka-office/domain-cms")
  const dbConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  }
  console.log('registering cms with dbConfig:', dbConfig);
  setup({ dbConfig });
}
