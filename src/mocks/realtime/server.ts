import { toSocketIo } from '@mswjs/socket.io-binding'
import type { WebSocketHandlerConnection } from 'msw'

import {
  type RealtimeEvent,
  SUBSCRIBE,
  UNSUBSCRIBE,
} from '@/contracts/realtime'

import { getMockConfig, subscribeMockConfig } from '../config'

/*
 * Socket.IO server emulated on top of MSW's WebSocket interception.
 *
 * @mswjs/socket.io-binding encodes/decodes Socket.IO packets but has no rooms,
 * broadcasting or heartbeat, so this module adds:
 * - a connection registry with per-connection topic subscriptions;
 * - Engine.IO pings (otherwise socket.io-client drops the link every ~30 s);
 * - the CONNECT packet auth payload (session token), read from raw frames;
 * - an event log to re-send duplicates or stale versions in tests.
 */

const PING_INTERVAL_MS = 25_000
/** Application close codes (4000–4999 are free for applications). */
const CLOSE_OFFLINE = 4001
const CLOSE_SHUTDOWN = 4002
const EVENT_LOG_SIZE = 50

interface Connection {
  id: string
  io: ReturnType<typeof toSocketIo>
  raw: WebSocketHandlerConnection['client']
  topics: Set<string>
  /** Session token sent in the Socket.IO CONNECT packet (auth), if any. */
  token: string | null
  heartbeat: ReturnType<typeof setInterval>
}

const connections = new Map<string, Connection>()

type TopicGuard = (token: string | null, topic: string) => boolean
let topicGuard: TopicGuard = () => true

/**
 * Decides which topics a connection may join (private topics such as
 * order:<id> belong to one collector). Registered by the domain layer.
 */
export function setTopicGuard(guard: TopicGuard) {
  topicGuard = guard
}
const eventLog: { topic: string; event: RealtimeEvent }[] = []

type ConnectionListener = (count: number) => void
const connectionListeners = new Set<ConnectionListener>()

function notifyConnections() {
  for (const listener of connectionListeners) listener(connections.size)
}

function readTopics(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

/** "40{...}" is the Socket.IO CONNECT packet; its JSON is the `auth` option. */
function readAuthToken(frame: string) {
  if (!frame.startsWith('40')) return undefined
  try {
    const auth: unknown = JSON.parse(frame.slice(2) || '{}')
    if (typeof auth === 'object' && auth !== null && 'token' in auth) {
      return typeof auth.token === 'string' ? auth.token : null
    }
    return null
  } catch {
    return null
  }
}

export function handleConnection(connection: WebSocketHandlerConnection) {
  const { client } = connection

  // Offline scenario: never answer the handshake, like an unreachable network.
  // (Closing before "open" would leave socket.io-client waiting for an error
  // that MSW does not emit.) The client gives up after its connection timeout
  // and keeps retrying until the scenario goes back online.
  if (getMockConfig().offline) return

  const io = toSocketIo(connection)
  const entry: Connection = {
    id: client.id,
    io,
    raw: client,
    topics: new Set(),
    token: null,
    heartbeat: setInterval(() => {
      client.send('2') // Engine.IO ping; the client answers "3" (pong).
    }, PING_INTERVAL_MS),
  }
  connections.set(client.id, entry)
  notifyConnections()

  client.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') return
    const token = readAuthToken(event.data)
    if (token !== undefined) entry.token = token
  })

  io.client.on(SUBSCRIBE, (_event, value: unknown) => {
    for (const topic of readTopics(value)) {
      if (topicGuard(entry.token, topic)) entry.topics.add(topic)
    }
  })

  io.client.on(UNSUBSCRIBE, (_event, value: unknown) => {
    for (const topic of readTopics(value)) entry.topics.delete(topic)
  })

  client.addEventListener('close', () => {
    clearInterval(entry.heartbeat)
    connections.delete(client.id)
    notifyConnections()
  })
}

function deliver(topic: string, event: RealtimeEvent) {
  for (const connection of connections.values()) {
    if (connection.topics.has(topic))
      connection.io.client.emit(event.type, event)
  }
}

/** Emits an event to every connection subscribed to `topic`. */
export function publish(topic: string, event: RealtimeEvent) {
  eventLog.push({ topic, event })
  if (eventLog.length > EVENT_LOG_SIZE) eventLog.shift()
  deliver(topic, event)
}

/** Re-sends the last event unchanged (same id): a duplicate delivery. */
export function resendLastEvent() {
  const last = eventLog.at(-1)
  if (!last) return null
  deliver(last.topic, last.event)
  return last.event
}

/**
 * Re-sends an older event of the same resource as the last one, with a new
 * id: a late, out-of-order delivery that must not regress newer state.
 */
export function sendStaleEvent() {
  const last = eventLog.at(-1)
  if (!last) return null
  const older = eventLog.findLast(
    (entry) =>
      entry.event.resource.id === last.event.resource.id &&
      entry.event.version < last.event.version,
  )
  if (!older) return null
  const stale = { ...older.event, id: `${older.event.id}-late` }
  deliver(older.topic, stale)
  return stale
}

/** Drops every connection (the client reconnects on its own). */
export function disconnectAll(reason = 'server shutdown') {
  const code = reason === 'offline' ? CLOSE_OFFLINE : CLOSE_SHUTDOWN
  for (const connection of connections.values()) {
    connection.raw.close(code, reason)
  }
}

export function connectionCount() {
  return connections.size
}

export function connectionTokens() {
  return [...connections.values()].map((connection) => connection.token)
}

/** Topics joined by each open connection (tests: private topic guard). */
export function connectionTopics() {
  return [...connections.values()].map((connection) => [...connection.topics])
}

export function subscribeConnections(listener: ConnectionListener) {
  connectionListeners.add(listener)
  return () => {
    connectionListeners.delete(listener)
  }
}

export function clearEventLog() {
  eventLog.length = 0
}

// Going offline also drops the realtime link.
subscribeMockConfig((config) => {
  if (config.offline) disconnectAll('offline')
})
