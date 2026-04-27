'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    setSent(true)
    setLoading(false)
  }

  const box: React.CSSProperties = { background: '#141418', border: '1.5px solid #2a2a35', borderRadius: 18, padding: 28 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c0f', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: '#6c63ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14 }}>M↗</div>
          <span style={{ fontFamily: 'Clash Display,sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#f0f0f5' }}>MultiOpen</span>
        </Link>
        <div style={box}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📬</div>
              <h2 style={{ fontFamily: 'Clash Display,sans-serif', fontSize: '1.3rem', marginBottom: 8 }}>Check your inbox</h2>
              <p style={{ color: '#9090a8', fontSize: '.88rem' }}>If that email has an account, a reset link is on its way.</p>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'Clash Display,sans-serif', fontSize: '1.5rem', marginBottom: 4 }}>Reset password</h1>
              <p style={{ color: '#9090a8', fontSize: '.88rem', marginBottom: 22 }}>Enter your email to receive a reset link.</p>
              <form onSubmit={submit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9090a8', marginBottom: 5 }}>Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '11px 14px', background: '#1c1c22', border: '1.5px solid #2a2a35', borderRadius: 10, color: '#f0f0f5', fontFamily: 'Cabinet Grotesk,sans-serif', fontSize: '.9rem', outline: 'none' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'Cabinet Grotesk,sans-serif', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', opacity: loading ? .6 : 1 }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '.875rem', color: '#5a5a70' }}>
          <Link href="/login" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 600 }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
