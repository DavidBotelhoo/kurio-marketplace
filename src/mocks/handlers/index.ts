import { authHandlers } from './auth'
import { catalogHandlers } from './catalog'
import { realtimeHandlers } from '../realtime/handler'
import { systemHandlers } from './system'

export const handlers = [
  ...systemHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...realtimeHandlers,
]
