import { catalogHandlers } from './catalog'
import { systemHandlers } from './system'

export const handlers = [...systemHandlers, ...catalogHandlers]
