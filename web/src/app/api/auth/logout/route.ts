import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {})
  }
  const res = NextResponse.json({ success: true })
  res.cookies.delete('session')
  return res
}
