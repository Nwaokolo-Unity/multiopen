import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  const hash = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'unity@zeroup.org' },
    update: {},
    create: {
      email: 'unity@zeroup.org',
      emailVerified: true,
      passwordHash: hash,
      name: 'Unity',
      plan: 'pro',
      isAdmin: true,
    },
  })

  await prisma.link.upsert({
    where: { slug: 'bridgeai' },
    update: {},
    create: {
      userId: user.id,
      slug: 'bridgeai',
      name: 'ZeroUp BridgeAI Launch',
      title: 'BridgeAI: Connecting African Youth to AI Careers',
      description: 'We just launched BridgeAI — pairing 500 young Nigerians with AI mentors.',
      status: 'active',
      targets: {
        create: [
          { platform: 'facebook', canonicalUrl: 'https://facebook.com/zeroupinitiative/posts/123456', position: 0 },
          { platform: 'x',        canonicalUrl: 'https://x.com/zeroupng/status/1783749283700',        position: 1 },
          { platform: 'instagram',canonicalUrl: 'https://instagram.com/p/AbCdEfGhIj/',               position: 2 },
          { platform: 'web',      canonicalUrl: 'https://facebook.com/zeroupinitiative/posts/123456', position: 3 },
        ],
      },
    },
  })

  console.log('Seed complete. Login: unity@zeroup.org / password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
