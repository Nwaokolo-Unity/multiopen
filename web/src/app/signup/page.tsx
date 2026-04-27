'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Signup failed'); return }
      router.push('/dashboard')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '8+ characters' },
  ]

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0c0c0f',padding:20}}>
      <div style={{width:'100%',maxWidth:400}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:10,justifyContent:'center',marginBottom:28,textDecoration:'none'}}>
          <div style={{width:36,height:36,background:'#6c63ff',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:14}}>M↗</div>
          <span style={{fontFamily:'Clash Display,sans-serif',fontWeight:700,fontSize:'1.2rem',color:'#f0f0f5'}}>MultiOpen</span>
        </Link>
        <div style={{background:'#141418',border:'1.5px solid #2a2a35',borderRadius:18,padding:28}}>
          <h1 style={{fontFamily:'Clash Display,sans-serif',fontSize:'1.5rem',marginBottom:4}}>Create account</h1>
          <p style={{color:'#9090a8',fontSize:'.88rem',marginBottom:22}}>Free forever. No credit card needed.</p>
          {error && <div style={{background:'rgba(255,71,87,.08)',border:'1px solid rgba(255,71,87,.25)',color:'#ff6b7a',padding:'9px 13px',borderRadius:10,fontSize:'.82rem',marginBottom:12}}>{error}</div>}
          <form onSubmit={submit}>
            {fields.map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.06em',color:'#9090a8',marginBottom:5}}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} required
                  style={{width:'100%',padding:'11px 14px',background:'#1c1c22',border:'1.5px solid #2a2a35',borderRadius:10,color:'#f0f0f5',fontFamily:'Cabinet Grotesk,sans-serif',fontSize:'.9rem',outline:'none'}}/>
              </div>
            ))}
            <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#6c63ff',color:'#fff',border:'none',borderRadius:10,fontFamily:'Cabinet Grotesk,sans-serif',fontWeight:700,fontSize:'.95rem',cursor:'pointer',opacity:loading?.6:1,marginTop:4}}>
              {loading?'Creating account…':'Create free account'}
            </button>
          </form>
        </div>
        <p style={{textAlign:'center',marginTop:18,fontSize:'.875rem',color:'#5a5a70'}}>
          Already have an account? <Link href="/login" style={{color:'#6c63ff',textDecoration:'none',fontWeight:600}}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
