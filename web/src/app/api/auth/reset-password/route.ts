import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verifyResetToken } from '@/lib/reset-token'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = body.token
    const password = body.password
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    }
    const userId = verifyResetToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Link invalid or expired' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    await prisma.session.deleteMany({ where: { userId } })
    const session = await createSession(userId, req)
    const res = NextResponse.json({ success: true })
    res.cookies.set('session', session.token, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 2592000,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
