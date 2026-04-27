import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const linkId = body.linkId
    const reason = body.reason || 'other'
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    await prisma.report.create({
      data: { linkId, reporterIp: ip, reason },
    })
    return NextResponse.json({ reported: true })
  } catch {
    return NextResponse.json({ reported: false })
  }
}
