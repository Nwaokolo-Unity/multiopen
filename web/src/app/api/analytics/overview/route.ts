import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const days = parseInt(new URL(req.url).searchParams.get('days') ?? '30')
    const since = new Date(Date.now() - days * 86400000)
    const links = await prisma.link.findMany({ where: { userId: user.id, status: { not: 'deleted' } }, select: { id: true } })
    const ids = links.map(l => l.id)
    if (ids.length === 0) return NextResponse.json({ totalClicks: 0, totalOpens: 0, openRatePct: 0, byPlatform: [], byDevice: [], byCountry: [], clicksByDay: [], topReferrers: [] })
    const [totalClicks, totalOpens, byDevice, byCountry, byRef] = await Promise.all([
      prisma.click.count({ where: { linkId: { in: ids }, clickedAt: { gte: since } } }),
      prisma.click.count({ where: { linkId: { in: ids }, targetId: { not: null }, clickedAt: { gte: since } } }),
      prisma.click.groupBy({ by: ['deviceType'], where: { linkId: { in: ids }, clickedAt: { gte: since } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
      prisma.click.groupBy({ by: ['ipCountry'], where: { linkId: { in: ids }, clickedAt: { gte: since }, ipCountry: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 8 }),
      prisma.click.groupBy({ by: ['referrerDomain'], where: { linkId: { in: ids }, clickedAt: { gte: since }, referrerDomain: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 8 }),
    ])
    return NextResponse.json({
      totalClicks, totalOpens, openRatePct: totalClicks > 0 ? Math.round(totalOpens / totalClicks * 100) : 0,
      byDevice: byDevice.map(d => ({ device: d.deviceType, clicks: d._count.id, pct: totalClicks > 0 ? Math.round(d._count.id / totalClicks * 100) : 0 })),
      byCountry: byCountry.map(c => ({ countryCode: c.ipCountry ?? 'XX', country: c.ipCountry ?? 'Unknown', clicks: c._count.id, pct: totalClicks > 0 ? Math.round(c._count.id / totalClicks * 100) : 0 })),
      topReferrers: byRef.map(r => ({ domain: r.referrerDomain ?? '(direct)', clicks: r._count.id })),
      byPlatform: [], clicksByDay: [],
    })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
