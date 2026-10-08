import { catalogHandlers } from './catalog'
import { realtimeHandlers } from '../realtime/handler'
import { systemHandlers } from './system'

export const handlers = [
  ...systemHandlers,
  ...catalogHandlers,
  ...realtimeHandlers,
]
