/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API 配置
  readonly VITE_API_URL: string

  // 图片配置
  readonly VITE_IMAGE_BASE_URL: string
  readonly VITE_IMAGE_PROTOCOL: string
  readonly VITE_IMAGE_HOSTNAME: string

  // WebSocket 配置 (Reverb)
  readonly VITE_REVERB_APP_KEY: string
  readonly VITE_REVERB_HOST: string
  readonly VITE_REVERB_PORT: string
  readonly VITE_REVERB_SCHEME: string

  // 安全配置
  readonly VITE_API_SIGN_IN_PRIVATE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
