import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from './prisma'

export async function createSession(userId: string, req: NextRequest) {
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await prisma.session.create({
    data: {
      userId, tokenHash, expiresAt,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    },
  })
  return { token, expiresAt }
}

export async function requireAuth(req: NextRequest) {
  const token =
    req.cookies.get('session')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) throw new Error('UNAUTHORIZED')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    throw new Error('UNAUTHORIZED')
  }
  if (session.user.isSuspended) throw new Error('UNAUTHORIZED')
  return session.user
}
