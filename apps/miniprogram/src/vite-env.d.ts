/// <reference types="weapp-vite/client" />
/// <reference path="../components.d.ts" />
/// <reference path="../typed-components.d.ts" />

interface ImportMetaEnv {
  readonly VITE_CLOUD_ENV: string
  readonly VITE_CLOUD_APPID: string
  readonly VITE_SERVICE_NAME: string
  readonly VITE_LOCAL_API_BASE: string
  readonly VITE_LOCAL_MOCK_OPENID: string
  readonly VITE_LOCAL_MOCK_ENV: string
  readonly VITE_RPC_CALL_MODE: 'cloud' | 'local'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
