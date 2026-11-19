/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Comma-separated package ids of the apps shown in the per-app table. */
  readonly VITE_APKLIS_APPS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
