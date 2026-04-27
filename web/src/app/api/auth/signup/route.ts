import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email?.toLowerCase()
    const password = body.password
    const name = body.name
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { email, passwordHash, name } })
    const session = await createSession(user.id, req)
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, isAdmin: user.isAdmin },
      token: session.token,
      expiresAt: session.expiresAt,
    }, { status: 201 })
    res.cookies.set('session', session.token, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 2592000,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
