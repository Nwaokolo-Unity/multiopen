import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectOS, buildDeepLink, PLATFORM_META } from '@/lib/deeplinks'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ua = req.headers.get('user-agent') || ''
    const os = detectOS(ua)
    const link = await prisma.link.findFirst({
      where: {
        slug: params.slug,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { targets: { where: { isEnabled: true }, orderBy: { position: 'asc' } } },
    })
    if (!link) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.click.create({
      data: {
        linkId: link.id,
        ipCountry: req.headers.get('cf-ipcountry') || undefined,
        deviceType: os === 'android' ? 'android' : os === 'ios' ? 'ios' : 'desktop',
      },
    }).catch(() => {})
    return NextResponse.json({
      link: {
        id: link.id,
        slug: link.slug,
        title: link.title || 'View this post',
        description: link.description,
        thumbnailUrl: link.thumbnailUrl,
        isPasswordProtected: !!link.passwordHash,
      },
      targets: link.targets.map((t) => {
        const meta = PLATFORM_META[t.platform as keyof typeof PLATFORM_META] || PLATFORM_META.web
        return {
          id: t.id,
          platform: t.platform,
          canonicalUrl: t.canonicalUrl,
          deepLinkUri: buildDeepLink(t.platform as any, t.canonicalUrl, os) || undefined,
          position: t.position,
          label: meta.label,
          subLabel: meta.subLabel,
          brandColor: meta.brandColor,
          bgColor: meta.bgColor,
          iconChar: meta.iconChar,
        }
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await requireAuth(req)
    const link = await prisma.link.findFirst({ where: { slug: params.slug, userId: user.id } })
    if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const updated = await prisma.link.update({
      where: { id: link.id },
      data: {
        name: body.name,
        title: body.title,
        description: body.description,
        status: body.status,
        clickCap: body.clickCap,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await requireAuth(req)
    const link = await prisma.link.findFirst({ where: { slug: params.slug, userId: user.id } })
    if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.link.update({ where: { id: link.id }, data: { status: 'deleted' } })
    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
