import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmailToken } from '@/lib/reset-token'

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=invalid`)
  const userId = verifyEmailToken(token)
  if (!userId) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=expired`)
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } })
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?verified=1`)
}
