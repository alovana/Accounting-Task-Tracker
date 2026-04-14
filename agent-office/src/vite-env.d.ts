/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENCLAW_GATEWAY_URL?: string
  readonly VITE_OPENCLAW_GATEWAY_SHARED_SECRET?: string
  readonly VITE_OPENCLAW_GATEWAY_SHARED_SECRET_KIND?: 'token' | 'password'
  readonly VITE_OPENCLAW_GATEWAY_TOKEN?: string
  readonly VITE_OPENCLAW_GATEWAY_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
