import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { buildDeepLink } from '@/lib/deeplinks'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const name = body.name
    const targets = body.targets
    const title = body.title
    const description = body.description
    const customSlug = body.slug
    const clickCap = body.clickCap
    const expiresAt = body.expiresAt

    if (!targets || targets.length === 0) {
      return NextResponse.json({ error: 'At least one target required' }, { status: 400 })
    }

    const slug = customSlug || nanoid(7).toLowerCase().replace(/[^a-z0-9]/g, 'x')
    const existing = await prisma.link.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }

    const link = await prisma.link.create({
      data: {
        userId: user.id,
        slug,
        name,
        title,
        description,
        clickCap,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        targets: {
          create: targets.map((t: any) => ({
            platform: t.platform,
            canonicalUrl: t.canonicalUrl,
            position: t.position || 0,
            deepLinkUri: buildDeepLink(t.platform, t.canonicalUrl, 'android') || undefined,
          })),
        },
      },
      include: { targets: { orderBy: { position: 'asc' } } },
    })

    const base = process.env.NEXT_PUBLIC_BASE_URL || ''
    return NextResponse.json({ ...link, shortUrl: base + '/l/' + slug }, { status: 201 })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const links = await prisma.link.findMany({
      where: { userId: user.id, status: { not: 'deleted' } },
      include: {
        targets: { orderBy: { position: 'asc' } },
        _count: { select: { clicks: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    const base = process.env.NEXT_PUBLIC_BASE_URL || ''
    return NextResponse.json({
      links: links.map((l) => ({ ...l, shortUrl: base + '/l/' + l.slug })),
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
