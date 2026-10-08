import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { favoritesHandlers } from './favorites'
import { realtimeHandlers } from '../realtime/handler'
import { systemHandlers } from './system'

export const handlers = [
  ...systemHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...realtimeHandlers,
]
