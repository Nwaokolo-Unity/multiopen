import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateResetToken } from '@/lib/reset-token'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email?.toLowerCase()
    if (!email) return NextResponse.json({ sent: true })
    const user = await prisma.user.findUnique({ where: { email } })
    if (user && !user.isSuspended) {
      const token = generateResetToken(user.id)
      await sendPasswordResetEmail(email, token).catch(console.error)
    }
    return NextResponse.json({ sent: true })
  } catch {
    return NextResponse.json({ sent: true })
  }
}
