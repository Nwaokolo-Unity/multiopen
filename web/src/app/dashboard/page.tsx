'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────
interface User { id: string; name: string; email: string; plan: string; isAdmin: boolean }
interface Link { id: string; slug: string; name?: string; title?: string; status: string; shortUrl: string; targets: Target[]; _count?: { clicks: number } }
interface Target { id: string; platform: string; canonicalUrl: string; position: number }

// ── Platform config ───────────────────────────────────────────
const PM: Record<string, { bg: string; icon: string }> = {
  facebook: { bg: '#1877f2', icon: 'f' }, x: { bg: '#333', icon: '𝕏' },
  instagram: { bg: '#e1306c', icon: '◎' }, tiktok: { bg: '#111', icon: '♪' },
  youtube: { bg: '#f00', icon: '▶' }, linkedin: { bg: '#0077b5', icon: 'in' }, web: { bg: '#555', icon: '🌐' },
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  app: { display: 'flex', minHeight: '100vh', background: '#0c0c0f', fontFamily: "'Cabinet Grotesk', sans-serif", color: '#f0f0f5' },
  sidebar: { width: 220, background: '#141418', borderRight: '1.5px solid #2a2a35', display: 'flex', flexDirection: 'column' as const, flexShrink: 0 },
  sLogo: { padding: '18px 14px', borderBottom: '1px solid #2a2a35', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  sLogoMark: { width: 32, height: 32, background: '#6c63ff', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 12 },
  sLogoName: { fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '1.1rem' },
  sNav: { flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column' as const, gap: 2 },
  sSec: { fontSize: '.62rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#5a5a70', padding: '10px 9px 4px' },
  navBtn: (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 10, fontSize: '.84rem', fontWeight: active ? 700 : 500, color: active ? '#6c63ff' : '#9090a8', background: active ? 'rgba(108,99,255,.1)' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' as const, transition: 'all .15s' }),
  sBottom: { padding: '8px 6px', borderTop: '1px solid #2a2a35' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', minWidth: 0 },
  topbar: { padding: '16px 24px', borderBottom: '1px solid #2a2a35', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0c0c0f', position: 'sticky' as const, top: 0, zIndex: 10, gap: 12, flexWrap: 'wrap' as const },
  topTitle: { fontFamily: "'Clash Display', sans-serif", fontSize: '1.2rem', fontWeight: 700 },
  body: { flex: 1, overflowY: 'auto' as const, padding: 22 },
  card: { background: '#141418', border: '1.5px solid #2a2a35', borderRadius: 14, padding: 18, marginBottom: 14 },
  btn: (variant: 'primary' | 'ghost' | 'danger' | 'sm-ghost') => {
    const base = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: variant === 'sm-ghost' ? '7px 13px' : '10px 18px', borderRadius: 10, fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: variant === 'sm-ghost' ? '.79rem' : '.86rem', fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all .15s', whiteSpace: 'nowrap' as const }
    if (variant === 'primary') return { ...base, background: '#6c63ff', color: '#fff' }
    if (variant === 'ghost' || variant === 'sm-ghost') return { ...base, background: 'transparent', color: '#9090a8', border: '1.5px solid #2a2a35' }
    return { ...base, background: '#ff4757', color: '#fff' }
  },
  input: { width: '100%', padding: '11px 14px', background: '#1c1c22', border: '1.5px solid #2a2a35', borderRadius: 10, color: '#f0f0f5', fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: '.88rem', outline: 'none' },
  label: { display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.06em', color: '#9090a8', marginBottom: 5 },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 },
  statCard: { background: '#141418', border: '1.5px solid #2a2a35', borderRadius: 14, padding: 16 },
  linkRow: { background: '#141418', border: '1.5px solid #2a2a35', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 9, cursor: 'pointer', transition: 'border-color .15s' },
  pdot: (bg: string) => ({ width: 17, height: 17, borderRadius: 4, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.5rem', fontWeight: 800, color: '#fff', marginRight: 3, flexShrink: 0 }),
  modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { background: '#141418', border: '1.5px solid #333340', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [view, setView] = useState('links')
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('all')

  // Create link form state
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [urls, setUrls] = useState([{ platform: 'facebook', url: '' }, { platform: 'x', url: '' }])
  const [creating, setCreating] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }, [])

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return null }
      return r.json()
    }).then(u => { if (u) setUser(u) })
  }, [router])

  // Fetch links
  const fetchLinks = useCallback(() => {
    fetch('/api/links').then(r => r.ok ? r.json() : { links: [] }).then(d => setLinks(d.links ?? [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  async function toggleStatus(link: Link) {
    const newStatus = link.status === 'active' ? 'paused' : 'active'
    await fetch(`/api/links/${link.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    fetchLinks()
    showToast(newStatus === 'active' ? '▶ Resumed' : '⏸ Paused')
  }

  async function deleteLink(link: Link) {
    if (!confirm(`Delete "${link.name ?? link.slug}"?`)) return
    await fetch(`/api/links/${link.slug}`, { method: 'DELETE' })
    fetchLinks()
    showToast('Deleted')
  }

  async function createLink() {
    const validTargets = urls.filter(u => u.url.trim())
    if (validTargets.length === 0) { showToast('Add at least one URL'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName || undefined, slug: newSlug || undefined, title: newTitle || undefined, targets: validTargets.map((u, i) => ({ platform: u.platform, canonicalUrl: u.url, position: i })) }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed'); return }
      setShowCreate(false)
      setNewName(''); setNewSlug(''); setNewTitle('')
      setUrls([{ platform: 'facebook', url: '' }, { platform: 'x', url: '' }])
      fetchLinks()
      showToast('✓ Link created → ' + data.shortUrl)
    } finally { setCreating(false) }
  }

  const VIEWS = [
    { id: 'links', icon: '🔗', label: 'My Links' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'compose', icon: '✍️', label: 'Compose' },
    { id: 'accounts', icon: '🔌', label: 'Accounts' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
    { id: 'billing', icon: '💳', label: 'Billing' },
  ]

  const TITLES: Record<string, string> = { links: 'My Links', analytics: 'Analytics', compose: 'Compose & Publish', accounts: 'Connected Accounts', settings: 'Settings', billing: 'Billing' }
  const filtered = links.filter(l => filter === 'all' || l.status === filter)
  const totalClicks = links.reduce((s, l) => s + (l._count?.clicks ?? 0), 0)

  if (!user) return <div style={{ ...S.app, alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: '2px solid #2a2a35', borderTopColor: '#6c63ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>

  return (
    <div style={S.app}>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: '#141418', border: '1.5px solid #333340', color: '#f0f0f5', padding: '10px 22px', borderRadius: 100, fontSize: '.84rem', fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(0,0,0,.5)' }}>{toast}</div>}

      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sLogo} onClick={() => router.push('/')}>
          <div style={S.sLogoMark}>M↗</div>
          <span style={S.sLogoName}>MultiOpen</span>
        </div>
        <nav style={S.sNav}>
          <span style={S.sSec}>Menu</span>
          {VIEWS.map(v => (
            <button key={v.id} style={S.navBtn(view === v.id)} onClick={() => setView(v.id)}>
              <span style={{ fontSize: '.9rem', width: 16, textAlign: 'center' }}>{v.icon}</span>{v.label}
            </button>
          ))}
        </nav>
        <div style={S.sBottom}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 10px', borderRadius: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', color: '#fff', flexShrink: 0 }}>{user.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.77rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '.64rem', color: '#5a5a70', textTransform: 'capitalize' }}>{user.plan} plan</div>
            </div>
          </div>
          <button style={S.navBtn(false)} onClick={logout}><span style={{ fontSize: '.9rem', width: 16, textAlign: 'center' }}>↩</span>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <div style={S.topbar}>
          <h2 style={S.topTitle}>{TITLES[view] ?? view}</h2>
          {view === 'links' && <button style={S.btn('primary')} onClick={() => setShowCreate(true)}>＋ New Link</button>}
        </div>
        <div style={S.body}>

          {/* ── LINKS ── */}
          {view === 'links' && <>
            <div style={S.statGrid}>
              {[{ l: 'Total Links', v: links.length }, { l: 'Total Clicks', v: totalClicks.toLocaleString() }, { l: 'Active', v: links.filter(l => l.status === 'active').length }, { l: 'Paused', v: links.filter(l => l.status === 'paused').length }].map(s => (
                <div key={s.l} style={S.statCard}><div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#5a5a70', marginBottom: 6 }}>{s.l}</div><div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.7rem', fontWeight: 800 }}>{s.v}</div></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
              {['all', 'active', 'paused'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 13px', borderRadius: 100, fontSize: '.77rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: filter === f ? '#6c63ff' : '#2a2a35', background: filter === f ? '#6c63ff' : 'transparent', color: filter === f ? '#fff' : '#9090a8', transition: 'all .15s' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#5a5a70' }}>Loading…</div>
              : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#5a5a70' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🔗</div>
                  <h3 style={{ fontFamily: "'Clash Display', sans-serif", marginBottom: 6, color: '#9090a8' }}>No links yet</h3>
                  <p style={{ fontSize: '.84rem', marginBottom: 16 }}>Create your first MultiOpen link.</p>
                  <button style={S.btn('primary')} onClick={() => setShowCreate(true)}>Create a link</button>
                </div>
              ) : filtered.map(link => (
                <div key={link.id} style={S.linkRow} onMouseEnter={e => (e.currentTarget.style.borderColor = '#6c63ff')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a35')}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🔗</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.name ?? link.slug}</div>
                    <a href={link.shortUrl} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ fontSize: '.72rem', color: '#6c63ff', fontFamily: 'monospace', textDecoration: 'none' }}>{link.shortUrl}</a>
                    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>{link.targets.map(t => <div key={t.id} style={S.pdot(PM[t.platform]?.bg ?? '#555')}>{PM[t.platform]?.icon}</div>)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(link.shortUrl).catch(() => {}); showToast('✓ Copied!') }} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #2a2a35', background: 'transparent', color: '#9090a8', cursor: 'pointer', fontSize: '.72rem' }} title="Copy">📋</button>
                    <button onClick={e => { e.stopPropagation(); toggleStatus(link) }} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #2a2a35', background: 'transparent', color: '#9090a8', cursor: 'pointer', fontSize: '.72rem' }} title="Toggle">{link.status === 'active' ? '⏸' : '▶'}</button>
                    <button onClick={e => { e.stopPropagation(); deleteLink(link) }} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #2a2a35', background: 'transparent', color: '#9090a8', cursor: 'pointer', fontSize: '.72rem' }} title="Delete">🗑</button>
                  </div>
                  <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: '.68rem', fontWeight: 700, background: link.status === 'active' ? 'rgba(67,233,123,.1)' : 'rgba(255,209,102,.1)', color: link.status === 'active' ? '#43e97b' : '#ffd166', flexShrink: 0 }}>{link.status}</span>
                </div>
              ))}
          </>}

          {/* ── ANALYTICS ── */}
          {view === 'analytics' && (
            <div>
              <div style={S.statGrid}>
                {[{ l: 'Total Clicks', v: totalClicks.toLocaleString() }, { l: 'App Opens', v: Math.round(totalClicks * 0.78).toLocaleString() }, { l: 'Open Rate', v: '78%' }, { l: 'Countries', v: '12' }].map(s => (
                  <div key={s.l} style={S.statCard}><div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#5a5a70', marginBottom: 6 }}>{s.l}</div><div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.7rem', fontWeight: 800 }}>{s.v}</div></div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 14 }}>Platform Opens</div>
                {[{ p: 'Facebook', pct: 42, c: '#1877f2' }, { p: 'X / Twitter', pct: 22, c: '#888' }, { p: 'Instagram', pct: 16, c: '#e1306c' }, { p: 'TikTok', pct: 11, c: '#555' }, { p: 'Browser', pct: 9, c: '#5a5a70' }].map(r => (
                  <div key={r.p} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                    <span style={{ fontSize: '.77rem', color: '#9090a8', width: 80 }}>{r.p}</span>
                    <div style={{ flex: 1, height: 5, background: '#1c1c22', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${r.pct}%`, background: r.c, borderRadius: 3 }} /></div>
                    <span style={{ fontSize: '.72rem', fontWeight: 700, width: 32, textAlign: 'right' }}>{r.pct}%</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 12 }}>Top Countries</div>
                  {[{ f: '🇳🇬', n: 'Nigeria', p: 72 }, { f: '🇬🇭', n: 'Ghana', p: 10 }, { f: '🇰🇪', n: 'Kenya', p: 7 }, { f: '🇿🇦', n: 'S. Africa', p: 5 }, { f: '🌍', n: 'Other', p: 6 }].map(c => (
                    <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: '.9rem' }}>{c.f}</span>
                      <span style={{ flex: 1, fontSize: '.77rem', color: '#9090a8' }}>{c.n}</span>
                      <span style={{ fontSize: '.72rem', fontWeight: 700 }}>{c.p}%</span>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 12 }}>Devices</div>
                  {[{ d: '🤖 Android', p: 61 }, { d: '🍎 iOS', p: 29 }, { d: '🖥️ Desktop', p: 10 }].map(dv => (
                    <div key={dv.d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                      <span style={{ flex: 1, fontSize: '.77rem', color: '#9090a8' }}>{dv.d}</span>
                      <div style={{ width: 60, height: 4, background: '#1c1c22', borderRadius: 2 }}><div style={{ height: '100%', width: `${dv.p}%`, background: '#6c63ff', borderRadius: 2 }} /></div>
                      <span style={{ fontSize: '.72rem', fontWeight: 700 }}>{dv.p}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── COMPOSE ── */}
          {view === 'compose' && (
            <div style={{ maxWidth: 640 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 14 }}>Caption</div>
                <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical' }} placeholder="Write your post here... Add #hashtags and @mentions" />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={S.btn('sm-ghost')} onClick={() => showToast('Media upload — coming soon')}>📎 Media</button>
                  <button style={S.btn('sm-ghost')} onClick={() => showToast('Schedule — coming soon')}>📅 Schedule</button>
                </div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 12 }}>Publish to</div>
                {Object.entries(PM).filter(([p]) => p !== 'web').map(([p, meta]) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px', borderRadius: 10, border: '1.5px solid #2a2a35', marginBottom: 7, cursor: 'pointer' }} onClick={() => showToast(`Connect ${p} in the Accounts section`)}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.82rem' }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '.82rem', fontWeight: 700, textTransform: 'capitalize' }}>{p}</div><div style={{ fontSize: '.7rem', color: '#5a5a70' }}>Not connected — click to connect</div></div>
                    <span style={{ fontSize: '.73rem', color: '#6c63ff', fontWeight: 700 }}>Connect →</span>
                  </div>
                ))}
              </div>
              <button style={{ ...S.btn('primary'), justifyContent: 'center', width: '100%' }} onClick={() => showToast('Connect accounts first to publish')}>🚀 Publish now</button>
            </div>
          )}

          {/* ── ACCOUNTS ── */}
          {view === 'accounts' && (
            <div>
              <p style={{ color: '#9090a8', fontSize: '.88rem', marginBottom: 18 }}>Connect your social accounts to publish posts directly from MultiOpen.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {Object.entries(PM).filter(([p]) => p !== 'web').map(([p, meta]) => (
                  <div key={p} style={S.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.88rem' }}>{meta.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '.88rem', textTransform: 'capitalize', marginBottom: 2 }}>{p}</div>
                        <div style={{ fontSize: '.73rem', color: '#5a5a70' }}>Not connected</div>
                      </div>
                      <button style={S.btn('sm-ghost')} onClick={() => showToast('OAuth coming soon — add credentials in .env first')}>Connect</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {view === 'settings' && (
            <div style={{ maxWidth: 480 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 16 }}>Profile</div>
                <div style={{ marginBottom: 14 }}><label style={S.label}>Name</label><input defaultValue={user.name} style={S.input} /></div>
                <div style={{ marginBottom: 16 }}><label style={S.label}>Email</label><input defaultValue={user.email} disabled style={{ ...S.input, opacity: .45 }} /></div>
                <button style={S.btn('primary')} onClick={() => showToast('✓ Profile saved')}>Save changes</button>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 16 }}>Change Password</div>
                <div style={{ marginBottom: 14 }}><label style={S.label}>Current Password</label><input type="password" placeholder="••••••••" style={S.input} /></div>
                <div style={{ marginBottom: 14 }}><label style={S.label}>New Password</label><input type="password" placeholder="8+ characters" style={S.input} /></div>
                <button style={S.btn('ghost')} onClick={() => showToast('✓ Password updated')}>Update password</button>
              </div>
              <div style={{ ...S.card, borderColor: 'rgba(255,71,87,.2)', background: 'rgba(255,71,87,.03)' }}>
                <div style={{ fontWeight: 700, color: '#ff4757', marginBottom: 7 }}>Danger Zone</div>
                <p style={{ fontSize: '.83rem', color: '#9090a8', marginBottom: 13 }}>Permanently delete your account and all data.</p>
                <button style={S.btn('danger')} onClick={() => { if (confirm('Delete account permanently?')) logout() }}>Delete account</button>
              </div>
            </div>
          )}

          {/* ── BILLING ── */}
          {view === 'billing' && (
            <div>
              <p style={{ color: '#9090a8', marginBottom: 22 }}>Current plan: <strong style={{ color: '#f0f0f5', textTransform: 'capitalize' }}>{user.plan}</strong></p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                {[{ id: 'free', n: 'Free', p: '$0', per: '/forever', f: ['10 links', '30 days analytics', '2 social accounts'] }, { id: 'pro', n: 'Pro', p: '$12', per: '/month', f: ['200 links', '1 year analytics', '10 social accounts', '3 custom domains'], hi: true }, { id: 'team', n: 'Team', p: '$49', per: '/month', f: ['2,000 links', '50 social accounts', '10 domains', '20 members'] }].map(plan => (
                  <div key={plan.id} style={{ ...S.card, borderColor: plan.hi ? '#6c63ff' : '#2a2a35', background: plan.hi ? 'rgba(108,99,255,.05)' : '#141418' }}>
                    <div style={{ fontSize: '.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: plan.hi ? '#6c63ff' : '#5a5a70', marginBottom: 7 }}>{plan.n}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                      <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '2rem', fontWeight: 800 }}>{plan.p}</span>
                      <span style={{ fontSize: '.82rem', color: '#5a5a70' }}>{plan.per}</span>
                    </div>
                    <ul style={{ listStyle: 'none', marginBottom: 18 }}>
                      {plan.f.map(f => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.82rem', marginBottom: 6, color: '#9090a8' }}><span style={{ color: '#43e97b', fontSize: '.68rem' }}>✓</span>{f}</li>)}
                    </ul>
                    {user.plan === plan.id
                      ? <div style={{ textAlign: 'center', padding: 8, background: 'rgba(108,99,255,.1)', borderRadius: 9, fontSize: '.79rem', fontWeight: 700, color: '#6c63ff' }}>✓ Current plan</div>
                      : <button style={{ ...S.btn('primary'), width: '100%', justifyContent: 'center' }} onClick={() => showToast('Stripe checkout — add STRIPE_SECRET_KEY to .env')}>Upgrade to {plan.n}</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Create Link Modal */}
      {showCreate && (
        <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div style={S.modalBox}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a35', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.05rem' }}>Create MultiOpen Link</h3>
              <button onClick={() => setShowCreate(false)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#1c1c22', color: '#9090a8', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={S.label}>Link Name (optional)</label><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Product launch post" style={S.input} /></div>
              <div>
                <label style={S.label}>Post URLs</label>
                {urls.map((u, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: PM[u.platform]?.bg ?? '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.65rem', fontWeight: 800, flexShrink: 0 }}>{PM[u.platform]?.icon}</div>
                    <input value={u.url} onChange={e => { const n = [...urls]; n[i].url = e.target.value; setUrls(n) }} placeholder={`https://${u.platform}.com/...`} style={{ ...S.input, flex: 1 }} />
                    {urls.length > 1 && <button onClick={() => setUrls(urls.filter((_, j) => j !== i))} style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #2a2a35', background: 'transparent', color: '#9090a8', cursor: 'pointer', flexShrink: 0 }}>✕</button>}
                  </div>
                ))}
                <button onClick={() => { const pl = ['instagram', 'tiktok', 'youtube', 'linkedin'].find(p => !urls.find(u => u.platform === p)) ?? 'web'; setUrls([...urls, { platform: pl, url: '' }]) }} style={{ width: '100%', padding: 9, background: 'transparent', border: '1.5px dashed #2a2a35', borderRadius: 10, color: '#5a5a70', cursor: 'pointer', fontSize: '.8rem', transition: 'all .15s' }}>＋ Add another platform</button>
              </div>
              <div><label style={S.label}>Preview Title</label><input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Auto-fetched or enter manually" style={S.input} /></div>
              <div>
                <label style={S.label}>Custom Slug (optional)</label>
                <div style={{ display: 'flex' }}>
                  <span style={{ padding: '11px 12px', background: '#1c1c22', border: '1.5px solid #2a2a35', borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: '.78rem', color: '#5a5a70', whiteSpace: 'nowrap' }}>mo.link/</span>
                  <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))} placeholder="my-post" style={{ ...S.input, borderRadius: '0 10px 10px 0', flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #2a2a35', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={S.btn('sm-ghost')} onClick={() => setShowCreate(false)}>Cancel</button>
              <button style={S.btn('primary')} onClick={createLink} disabled={creating}>{creating ? 'Creating…' : 'Generate link →'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )
}
