import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, plan: user.plan, isAdmin: user.isAdmin })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const { name } = z.object({ name: z.string().min(1).max(100) }).parse(await req.json())
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name } })
    return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name, plan: updated.plan, isAdmin: updated.isAdmin })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
