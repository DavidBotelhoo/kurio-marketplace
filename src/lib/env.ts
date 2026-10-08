export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  // An empty value in .env means "same origin".
  realtimeUrl: import.meta.env.VITE_REALTIME_URL
    ? import.meta.env.VITE_REALTIME_URL
    : undefined,
  // Socket.IO `path` (server and client must match). Not the default
  // "/socket.io": MSW strips that prefix when matching, which would also
  // capture Vite's HMR socket in development.
  realtimePath: '/realtime',
} as const
