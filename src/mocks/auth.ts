import type { AuthResponse, User } from '@/contracts/auth'

import { getMockConfig } from './config'
import { db } from './db/database'
import type { SessionRecord, UserRecord } from './db/schema'
import { apiError } from './responses'

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function toUserDto(user: UserRecord): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
}

export function createSession(userId: string): SessionRecord {
  const now = Date.now()
  const session: SessionRecord = {
    token: `kts_${base64Url(crypto.getRandomValues(new Uint8Array(24)))}`,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(
      now + getMockConfig().sessionTtlSeconds * 1000,
    ).toISOString(),
    revokedAt: null,
  }
  db.write((draft) => {
    // Keep only live sessions to bound the stored snapshot.
    draft.sessions = draft.sessions.filter(
      (item) => !item.revokedAt && Date.parse(item.expiresAt) > now,
    )
    draft.sessions.push(session)
  })
  return session
}

export function authResponse(
  user: UserRecord,
  session: SessionRecord,
): AuthResponse {
  return {
    session: { token: session.token, expiresAt: session.expiresAt },
    user: toUserDto(user),
  }
}

export function readBearerToken(request: Request) {
  const header = request.headers.get('Authorization') ?? ''
  const match = /^Bearer\s+(\S+)$/i.exec(header)
  return match?.[1] ?? null
}

type SessionCheck =
  | { ok: true; user: UserRecord; session: SessionRecord }
  | { ok: false; response: Response }

/**
 * Resolves the session of an authenticated request: 401 UNAUTHENTICATED when
 * the token is missing, unknown or revoked; 401 SESSION_EXPIRED after expiry.
 */
export function requireSession(request: Request): SessionCheck {
  const token = readBearerToken(request)
  const { sessions, users } = db.read()
  const session = token
    ? sessions.find((item) => item.token === token)
    : undefined
  if (!session || session.revokedAt) {
    return { ok: false, response: apiError(401, 'UNAUTHENTICATED') }
  }
  if (Date.parse(session.expiresAt) <= Date.now()) {
    return { ok: false, response: apiError(401, 'SESSION_EXPIRED') }
  }
  const user = users.find((item) => item.id === session.userId)
  if (!user) return { ok: false, response: apiError(401, 'UNAUTHENTICATED') }
  return { ok: true, user, session }
}

export function revokeSession(token: string) {
  db.write((draft) => {
    const session = draft.sessions.find((item) => item.token === token)
    if (session && !session.revokedAt)
      session.revokedAt = new Date().toISOString()
  })
}

/** Makes every active session expire now (control panel and tests). */
export function expireAllSessions() {
  const now = new Date().toISOString()
  db.write((draft) => {
    for (const session of draft.sessions) {
      if (!session.revokedAt) session.expiresAt = now
    }
  })
}

export function activeSessionCount() {
  const now = Date.now()
  return db
    .read()
    .sessions.filter(
      (item) => !item.revokedAt && Date.parse(item.expiresAt) > now,
    ).length
}
