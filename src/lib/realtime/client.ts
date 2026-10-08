import type { Socket } from 'socket.io-client'

import type { RealtimeEventMap, RealtimeEventType } from '@/contracts/realtime'
import { SUBSCRIBE, UNSUBSCRIBE } from '@/contracts/realtime-topics'
import { waitForRequestGate } from '@/lib/api/request-gate'
import { env } from '@/lib/env'

import type * as TransportModule from './transport'

export type RealtimeStatus =
  'idle' | 'connecting' | 'connected' | 'reconnecting'

type EventListener<Type extends RealtimeEventType> = (
  event: RealtimeEventMap[Type],
) => void

type Transport = typeof TransportModule

const SEEN_EVENTS_LIMIT = 500
const CONNECT_TIMEOUT_MS = 5_000

/**
 * Socket.IO client wrapper.
 *
 * - Payloads are validated against the realtime contract; invalid ones are
 *   dropped.
 * - Events are de-duplicated by id before listeners run, so side effects
 *   (notices) happen once. State updates also compare resource versions.
 * - Topic subscriptions are reference counted: a topic is released when the
 *   last component using it unmounts, and re-sent after every reconnection.
 * - Each session gets its own socket: switching or clearing the session
 *   closes the previous one, so its late events never reach the next user.
 * - Only the WebSocket transport is enabled (the mock layer cannot intercept
 *   HTTP long-polling).
 * - The transport (socket.io-client + event schemas) is imported lazily,
 *   after the request gate; see ./transport.ts.
 */
export class RealtimeClient {
  private socket: Socket | null = null
  /** Incremented on every connect/disconnect; stale async setups bail out. */
  private attempt = 0
  private active = false
  private token: string | null = null
  private status: RealtimeStatus = 'idle'
  private hasConnected = false
  private readonly topicCounts = new Map<string, number>()
  private readonly seenEventIds: string[] = []
  private readonly seenEventSet = new Set<string>()
  private readonly listeners = new Map<
    RealtimeEventType,
    Set<(event: never) => void>
  >()
  private readonly reconnectListeners = new Set<() => void>()
  private readonly statusListeners = new Set<() => void>()

  /** Opens (or reopens) the connection for the given session token. */
  connect(token: string | null) {
    if (this.active && token === this.token) return
    this.closeSocket()
    this.active = true
    this.token = token
    this.hasConnected = false
    this.setStatus('connecting')
    const attempt = ++this.attempt

    void waitForRequestGate()
      .then(() => import('./transport'))
      .then((transport) => {
        if (attempt !== this.attempt) return
        this.open(transport, token)
      })
  }

  private open(transport: Transport, token: string | null) {
    const { io, parseRealtimeEvent, realtimeEventTypes } = transport
    const socket = io(env.realtimeUrl ?? window.location.origin, {
      path: env.realtimePath,
      transports: ['websocket'],
      auth: { token },
      autoConnect: false,
      // Give up on a silent handshake quickly and retry (backoff 1–5 s).
      timeout: CONNECT_TIMEOUT_MS,
    })

    socket.on('connect', () => {
      this.setStatus('connected')
      const topics = [...this.topicCounts.keys()]
      if (topics.length) socket.emit(SUBSCRIBE, topics)
      if (this.hasConnected) {
        for (const listener of this.reconnectListeners) listener()
      }
      this.hasConnected = true
    })

    socket.on('disconnect', (reason) => {
      // "io client disconnect" is a deliberate close; anything else retries.
      if (reason !== 'io client disconnect') this.setStatus('reconnecting')
    })

    socket.io.on('reconnect_attempt', () => {
      this.setStatus('reconnecting')
    })

    for (const type of realtimeEventTypes) {
      socket.on(type, (payload: unknown) => {
        const event = parseRealtimeEvent(type, payload)
        if (event) this.receive(type, event)
        else if (import.meta.env.DEV)
          console.warn(`Invalid "${type}" event`, payload)
      })
    }

    this.socket = socket
    socket.connect()
  }

  disconnect() {
    this.attempt += 1
    this.active = false
    this.closeSocket()
    this.token = null
    this.setStatus('idle')
  }

  /** Subscribes to topics until the returned function is called. */
  subscribe(topics: readonly string[]) {
    const added = topics.filter((topic) => {
      const count = this.topicCounts.get(topic) ?? 0
      this.topicCounts.set(topic, count + 1)
      return count === 0
    })
    if (added.length && this.socket?.connected)
      this.socket.emit(SUBSCRIBE, added)

    let released = false
    return () => {
      if (released) return
      released = true
      const removed = topics.filter((topic) => {
        const count = (this.topicCounts.get(topic) ?? 1) - 1
        if (count > 0) {
          this.topicCounts.set(topic, count)
          return false
        }
        this.topicCounts.delete(topic)
        return true
      })
      if (removed.length && this.socket?.connected) {
        this.socket.emit(UNSUBSCRIBE, removed)
      }
    }
  }

  on<Type extends RealtimeEventType>(
    type: Type,
    listener: EventListener<Type>,
  ) {
    const set = this.listeners.get(type) ?? new Set()
    set.add(listener)
    this.listeners.set(type, set)
    return () => {
      set.delete(listener)
    }
  }

  /** Runs after every reconnection (not the first connection). */
  onReconnect(listener: () => void) {
    this.reconnectListeners.add(listener)
    return () => {
      this.reconnectListeners.delete(listener)
    }
  }

  getStatus = () => this.status

  subscribeStatus = (listener: () => void) => {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  private receive(
    type: RealtimeEventType,
    event: RealtimeEventMap[RealtimeEventType],
  ) {
    if (this.seenEventSet.has(event.id)) return
    this.remember(event.id)
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event as never)
    }
  }

  private remember(id: string) {
    this.seenEventIds.push(id)
    this.seenEventSet.add(id)
    if (this.seenEventIds.length > SEEN_EVENTS_LIMIT) {
      const oldest = this.seenEventIds.shift()
      if (oldest) this.seenEventSet.delete(oldest)
    }
  }

  private closeSocket() {
    if (!this.socket) return
    this.socket.removeAllListeners()
    this.socket.io.removeAllListeners()
    this.socket.disconnect()
    this.socket = null
  }

  private setStatus(status: RealtimeStatus) {
    if (status === this.status) return
    this.status = status
    for (const listener of this.statusListeners) listener()
  }
}

export const realtime = new RealtimeClient()
