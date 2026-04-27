'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      router.push('/dashboard')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0c0c0f',padding:20}}>
      <div style={{width:'100%',maxWidth:400}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:10,justifyContent:'center',marginBottom:28,textDecoration:'none'}}>
          <div style={{width:36,height:36,background:'#6c63ff',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:14}}>M↗</div>
          <span style={{fontFamily:'Clash Display,sans-serif',fontWeight:700,fontSize:'1.2rem',color:'#f0f0f5'}}>MultiOpen</span>
        </Link>
        <div style={{background:'#141418',border:'1.5px solid #2a2a35',borderRadius:18,padding:28}}>
          <h1 style={{fontFamily:'Clash Display,sans-serif',fontSize:'1.5rem',marginBottom:4}}>Welcome back</h1>
          <p style={{color:'#9090a8',fontSize:'.88rem',marginBottom:22}}>Sign in to your account</p>
          {error && <div style={{background:'rgba(255,71,87,.08)',border:'1px solid rgba(255,71,87,.25)',color:'#ff6b7a',padding:'9px 13px',borderRadius:10,fontSize:'.82rem',marginBottom:12}}>{error}</div>}
          <form onSubmit={submit}>
            {[{label:'Email',type:'email',val:email,set:setEmail,placeholder:'you@example.com'},{label:'Password',type:'password',val:password,set:setPassword,placeholder:'••••••••'}].map(f=>(
              <div key={f.label} style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9090a8',marginBottom:5}}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder} required
                  style={{width:'100%',padding:'11px 14px',background:'#1c1c22',border:'1.5px solid #2a2a35',borderRadius:10,color:'#f0f0f5',fontFamily:'Cabinet Grotesk,sans-serif',fontSize:'.9rem',outline:'none'}}/>
              </div>
            ))}
            <div style={{textAlign:'right',marginBottom:16}}>
              <Link href="/forgot-password" style={{fontSize:'.78rem',color:'#5a5a70',textDecoration:'none'}}>Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#6c63ff',color:'#fff',border:'none',borderRadius:10,fontFamily:'Cabinet Grotesk,sans-serif',fontWeight:700,fontSize:'.95rem',cursor:'pointer',opacity:loading?.6:1}}>
              {loading?'Signing in…':'Sign in'}
            </button>
          </form>
        </div>
        <p style={{textAlign:'center',marginTop:18,fontSize:'.875rem',color:'#5a5a70'}}>
          No account? <Link href="/signup" style={{color:'#6c63ff',textDecoration:'none',fontWeight:600}}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}
