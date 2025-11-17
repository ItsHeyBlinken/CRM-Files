/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_ENABLE_DEBUG_LOGGING?: string
  readonly VITE_ENABLE_MOCK_DATA?: string
  readonly VITE_NODE_ENV?: string
  // Add more env variables as needed
}

