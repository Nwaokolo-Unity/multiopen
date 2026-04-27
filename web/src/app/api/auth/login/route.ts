import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email?.toLowerCase()
    const password = body.password
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    if (user.isSuspended) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    const session = await createSession(user.id, req)
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, isAdmin: user.isAdmin },
      token: session.token,
      expiresAt: session.expiresAt,
    })
    res.cookies.set('session', session.token, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 2592000,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
