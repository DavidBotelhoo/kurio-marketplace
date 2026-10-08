/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the REST API. Defaults to "/api" (served by MSW in mock mode). */
  readonly VITE_API_URL?: string
  /** "true" serves the API from the MSW mock layer (dev, demo build and tests). */
  readonly VITE_ENABLE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
