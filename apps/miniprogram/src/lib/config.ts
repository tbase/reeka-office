/**
 * 应用配置
 */
export interface Config {
  /** 云开发环境 ID */
  CLOUD_ENV: string
  /** 云开发 AppID */
  CLOUD_APPID: string
  /** 业务服务默认名称 */
  TENANT_SERVICE_NAME: string
  /** 中心服务名称 */
  CENTER_SERVICE_NAME: string
  /** 本地开发 API 地址 */
  TENANT_LOCAL_API?: string
  /** 本地开发中心 API 地址 */
  CENTER_LOCAL_API?: string
  /** 本地开发 OpenID（用于调试） */
  LOCAL_OPENID?: string
  /** 本地开发环境 ID */
  LOCAL_ENV?: string
}

export const config: Config = {
  CLOUD_ENV: import.meta.env.VITE_CLOUD_ENV,
  CLOUD_APPID: import.meta.env.VITE_CLOUD_APPID,
  TENANT_SERVICE_NAME: import.meta.env.VITE_TENANT_SERVICE_NAME ?? 'reeka-office-api',
  CENTER_SERVICE_NAME: import.meta.env.VITE_CENTER_SERVICE_NAME,
  TENANT_LOCAL_API: import.meta.env.VITE_TENANT_LOCAL_API,
  CENTER_LOCAL_API: import.meta.env.VITE_CENTER_LOCAL_API,
  LOCAL_OPENID: import.meta.env.VITE_LOCAL_OPENID,
  LOCAL_ENV: import.meta.env.VITE_LOCAL_ENV,
}
