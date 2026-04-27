import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const { currentPassword, newPassword } = await req.json()
    const full = await prisma.user.findUnique({ where: { id: user.id } })
    if (!full?.passwordHash) return NextResponse.json({ error: 'No password set' }, { status: 400 })
    if (!await bcrypt.compare(currentPassword, full.passwordHash)) return NextResponse.json({ error: 'Current password incorrect' }, { status: 400 })
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
