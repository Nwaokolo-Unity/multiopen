import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  // Check if user is already logged in
  const cookieStore = cookies()
  const token = cookieStore.get('session')?.value

  if (token) {
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex')
      const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: true }
      })
      if (session && session.expiresAt > new Date() && !session.user.isSuspended) {
        redirect('/dashboard')
      }
    } catch {}
  }

  // Not logged in — show landing page
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', background: '#0c0c0f', color: '#f0f0f5', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, background: '#6c63ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff' }}>M↗</div>
        <span style={{ fontWeight: 800, fontSize: 22 }}>MultiOpen</span>
      </div>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800, textAlign: 'center', lineHeight: 1.1, marginBottom: 16 }}>
        Share once.<br />
        <span style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Open anywhere.</span>
      </h1>
      <p style={{ color: '#9090a8', maxWidth: 420, textAlign: 'center', lineHeight: 1.7, marginBottom: 32, fontSize: '1rem' }}>
        One short link for any social post. Recipients tap to open in Facebook, X, Instagram, TikTok — their choice.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/signup" style={{ padding: '13px 28px', background: '#6c63ff', color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: '.95rem' }}>Get started free →</a>
        <a href="/login" style={{ padding: '13px 28px', background: 'transparent', color: '#9090a8', borderRadius: 12, fontWeight: 600, textDecoration: 'none', fontSize: '.95rem', border: '1.5px solid #2a2a35' }}>Sign in</a>
      </div>
      <div style={{ marginTop: 48, display: 'flex', gap: 24, color: '#5a5a70', fontSize: '.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['One link, all platforms', 'No auto-redirects, ever', 'Real-time analytics'].map(f => (
          <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: '#43e97b' }}>✓</span>{f}</span>
        ))}
      </div>
    </main>
  )
}
