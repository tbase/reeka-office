/**
 * 应用配置
 */
export interface Config {
  /** 云开发环境 ID */
  CLOUD_ENV: string
  /** 云开发 AppID */
  CLOUD_APPID: string
  /** 服务名称 */
  SERVICE_NAME: string
  /** 本地开发 API 地址 */
  LOCAL_API?: string
  /** 本地开发 OpenID（用于调试） */
  LOCAL_OPENID?: string
  /** 本地开发环境 ID */
  LOCAL_ENV?: string
}

export const config: Config = {
  CLOUD_ENV: import.meta.env.VITE_CLOUD_ENV,
  CLOUD_APPID: import.meta.env.VITE_CLOUD_APPID,
  SERVICE_NAME: import.meta.env.VITE_SERVICE_NAME ?? 'reeka-office-api',
  LOCAL_API: import.meta.env.VITE_LOCAL_API,
  LOCAL_OPENID: import.meta.env.VITE_LOCAL_OPENID,
  LOCAL_ENV: import.meta.env.VITE_LOCAL_ENV,
}
