import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectOS } from '@/lib/deeplinks'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await req.json()
    const targetId = body.targetId
    const platform = body.platform
    const target = await prisma.target.findFirst({
      where: { id: targetId, link: { slug: params.slug } },
      include: { link: true },
    })
    if (!target) return NextResponse.json({ recorded: false })
    const ua = req.headers.get('user-agent') || ''
    const os = detectOS(ua)
    let referrerDomain = undefined
    try {
      const ref = req.headers.get('referer')
      if (ref) referrerDomain = new URL(ref).hostname
    } catch {}
    await prisma.click.create({
      data: {
        linkId: target.linkId,
        targetId: target.id,
        ipCountry: req.headers.get('cf-ipcountry') || undefined,
        deviceType: os === 'android' ? 'android' : os === 'ios' ? 'ios' : 'desktop',
        referrer: req.headers.get('referer') || undefined,
        referrerDomain,
      },
    })
    return NextResponse.json({ recorded: true })
  } catch {
    return NextResponse.json({ recorded: false })
  }
}
