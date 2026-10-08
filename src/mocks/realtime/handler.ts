import { ws } from 'msw'

import { env } from '@/lib/env'

import { handleConnection } from './server'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Matches the Socket.IO WebSocket transport on any origin (ws:// in dev,
 * wss:// on the deployed demo): …/realtime/?EIO=4&transport=websocket
 */
const socketIo = ws.link(new RegExp(`${escapeRegExp(env.realtimePath)}/`))

export const realtimeHandlers = [
  socketIo.addEventListener('connection', (connection) => {
    handleConnection(connection)
  }),
]
