declare namespace NodeJS {
  interface ProcessEnv {
    DB_HOST: string
    DB_PORT: string
    DB_USER: string
    DB_PASSWORD: string
    DB_NAME: string
    CENTER_DB_HOST?: string
    CENTER_DB_PORT?: string
    CENTER_DB_USER?: string
    CENTER_DB_PASSWORD?: string
    CENTER_DB_NAME?: string
    TENANT_CODE: string
    COS_BUCKET: string
    PRU_USERNAME?: string
    PRU_PASSWORD?: string
    PRU_LOGIN_URL?: string
    PRU_COOKIE_URL?: string
    PRU_COOKIE_TTL_MINUTES?: string
    PRU_BROWSER_TIMEOUT_MS?: string
  }
}
