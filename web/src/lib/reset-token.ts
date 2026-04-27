import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret'

function sign(payload: string) {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function generateResetToken(userId: string) {
  const expiry = Date.now() + 3600000
  const payload = `${userId}:${expiry}`
  return Buffer.from(`${payload}:${sign(payload)}`).toString('base64url')
}

export function verifyResetToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 3) return null
    const [userId, expiry, sig] = parts
    if (Date.now() > parseInt(expiry)) return null
    const expected = sign(`${userId}:${expiry}`)
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
    return userId
  } catch { return null }
}

export function generateVerifyToken(userId: string) {
  const expiry = Date.now() + 86400000
  const payload = `verify:${userId}:${expiry}`
  return Buffer.from(`${payload}:${sign(payload)}`).toString('base64url')
}

export function verifyEmailToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 4 || parts[0] !== 'verify') return null
    const [, userId, expiry, sig] = parts
    if (Date.now() > parseInt(expiry)) return null
    const expected = sign(`verify:${userId}:${expiry}`)
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
    return userId
  } catch { return null }
}
