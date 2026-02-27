/// <reference types="weapp-vite/client" />
/// <reference path="../components.d.ts" />
/// <reference path="../typed-components.d.ts" />

interface ImportMetaEnv {
  readonly VITE_CLOUD_ENV: string
  readonly VITE_CLOUD_APPID: string
  readonly VITE_SERVICE_NAME: string
  readonly VITE_LOCAL_API?: string
  readonly VITE_LOCAL_OPENID?: string
  readonly VITE_LOCAL_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
