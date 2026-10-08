import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'
import { installSessionLifecycle } from './features/auth/session-lifecycle'
import { setRequestGate } from './lib/api/request-gate'
import { env } from './lib/env'
import { createQueryClient } from './lib/query-client'
import { captureMockUrlOverrides } from './mocks/url-overrides'
import { createAppRouter } from './router'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

if (env.enableMocks) {
  // Runs before the router reads the URL; the heavy mock layer loads in
  // parallel with the first render and API calls wait for it.
  const overrides = captureMockUrlOverrides()
  const ready = import('./mocks/browser').then(({ startMocks }) =>
    startMocks(overrides),
  )
  setRequestGate(
    ready.catch((error: unknown) => {
      console.error('Não foi possível iniciar a API simulada.', error)
    }),
  )
}

const queryClient = createQueryClient()
const router = createAppRouter({ queryClient })
installSessionLifecycle(router, queryClient)

createRoot(rootElement).render(
  <StrictMode>
    <App router={router} queryClient={queryClient} />
  </StrictMode>,
)
