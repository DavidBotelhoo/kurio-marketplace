import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { MockPanel } from './mock-panel'

/** Renders the control panel in its own root, outside the app tree. */
export function mountMockPanel() {
  const container = document.createElement('div')
  container.id = 'kurio-mock-panel'
  document.body.append(container)
  createRoot(container).render(
    <StrictMode>
      <MockPanel />
    </StrictMode>,
  )
}
