/*
 * Password hashing for the mock API (PBKDF2-SHA256 via Web Crypto).
 * Fixtures and the persisted database only ever hold salted hashes.
 * Format: pbkdf2$<iterations>$<salt base64>$<hash base64>
 */
const ITERATIONS = 50_000

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, ITERATIONS)
  return `pbkdf2$${String(ITERATIONS)}$${toBase64(salt)}$${toBase64(hash)}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, hash] = stored.split('$')
  if (scheme !== 'pbkdf2' || !iterations || !salt || !hash) return false
  const candidate = await derive(password, fromBase64(salt), Number(iterations))
  const expected = fromBase64(hash)
  if (candidate.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) {
    diff |= (candidate[i] ?? 0) ^ (expected[i] ?? 0)
  }
  return diff === 0
}
