/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_IMAGE_BASE_URL: string
  readonly VITE_IMAGE_PROTOCOL: string
  readonly VITE_IMAGE_HOSTNAME: string
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
