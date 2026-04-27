import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0c0c0f', color: '#f0f0f5', textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔗</div>
      <h1 style={{ fontFamily: 'Clash Display,sans-serif', fontSize: '1.8rem', marginBottom: 8 }}>Link not found</h1>
      <p style={{ color: '#9090a8', marginBottom: 24 }}>This link may have expired or never existed.</p>
      <Link href="/" style={{ padding: '11px 24px', background: '#6c63ff', color: '#fff', borderRadius: 11, textDecoration: 'none', fontWeight: 700 }}>Go to MultiOpen →</Link>
    </div>
  )
}
