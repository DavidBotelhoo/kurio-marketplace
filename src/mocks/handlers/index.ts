import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { favoritesHandlers } from './favorites'
import { ordersHandlers } from './orders'
import { realtimeHandlers } from '../realtime/handler'
import { systemHandlers } from './system'
import { walletsHandlers } from './wallets'

export const handlers = [
  ...systemHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...walletsHandlers,
  ...ordersHandlers,
  ...realtimeHandlers,
]
