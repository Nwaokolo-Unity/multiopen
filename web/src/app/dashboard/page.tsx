'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User { id: string; name: string; email: string; plan: string; isAdmin: boolean }
interface Link { id: string; slug: string; name?: string; title?: string; status: string; shortUrl: string; targets: Target[]; _count?: { clicks: number } }
interface Target { id: string; platform: string; canonicalUrl: string; position: number }

const PM: Record<string, { bg: string; icon: string }> = {
  facebook: { bg: '#1877f2', icon: 'f' }, x: { bg: '#333', icon: '𝕏' },
  instagram: { bg: '#e1306c', icon: '◎' }, tiktok: { bg: '#111', icon: '♪' },
  youtube: { bg: '#f00', icon: '▶' }, linkedin: { bg: '#0077b5', icon: 'in' }, web: { bg: '#555', icon: '🌐' },
}

type View = 'links' | 'analytics' | 'compose' | 'accounts' | 'settings' | 'billing' | 'profile'
type Theme = 'dark' | 'light' | 'system'

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getEffectiveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') return getSystemTheme()
  return theme
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [view, setView] = useState<View>('links')
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('all')
  const [theme, setTheme] = useState<Theme>('system')
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [urls, setUrls] = useState([{ platform: 'facebook', url: '' }, { platform: 'x', url: '' }])
  const [creating, setCreating] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mo_theme') as Theme | null
    if (saved) setTheme(saved)
  }, [])

  // Save theme to localStorage when changed
  function changeTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem('mo_theme', t)
  }

  const effective = getEffectiveTheme(theme)
  const isDark = effective === 'dark'

  const C = {
    bg: isDark ? '#0c0c0f' : '#f0f0f5',
    surface: isDark ? '#141418' : '#ffffff',
    surface2: isDark ? '#1c1c22' : '#e8e8e8',
    border: isDark ? '#2a2a35' : '#d0d0d0',
    text: isDark ? '#f0f0f5' : '#111111',
    text2: isDark ? '#9090a8' : '#555555',
    text3: isDark ? '#5a5a70' : '#888888',
  }

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return null }
      return r.json()
    }).then(u => { if (u) setUser(u) })
  }, [router])

  const fetchLinks = useCallback(() => {
    fetch('/api/links').then(r => r.ok ? r.json() : { links: [] })
      .then(d => setLinks(d.links ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  useEffect(() => {
    if (view === 'analytics') {
      setAnalyticsLoading(true)
      fetch('/api/analytics/overview?days=30')
        .then(r => r.ok ? r.json() : null)
        .then(setAnalytics)
        .finally(() => setAnalyticsLoading(false))
    }
  }, [view])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/')
  }

  async function toggleStatus(link: Link) {
    const s = link.status === 'active' ? 'paused' : 'active'
    await fetch(`/api/links/${link.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) })
    fetchLinks(); showToast(s === 'active' ? '▶ Resumed' : '⏸ Paused')
  }

  async function deleteLink(link: Link) {
    if (!confirm(`Delete "${link.name ?? link.slug}"?`)) return
    await fetch(`/api/links/${link.slug}`, { method: 'DELETE' })
    fetchLinks(); showToast('Deleted')
  }

  async function createLink() {
    const validTargets = urls.filter(u => u.url.trim())
    if (validTargets.length === 0) { showToast('Add at least one URL'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName || undefined, slug: newSlug || undefined, title: newTitle || undefined,
          targets: validTargets.map((u, i) => ({ platform: u.platform, canonicalUrl: u.url, position: i }))
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed'); return }
      setShowCreate(false)
      setNewName(''); setNewSlug(''); setNewTitle('')
      setUrls([{ platform: 'facebook', url: '' }, { platform: 'x', url: '' }])
      fetchLinks()
      showToast('✓ Link created!')
    } finally { setCreating(false) }
  }

  const filtered = links.filter(l => filter === 'all' || l.status === filter)
  const totalClicks = links.reduce((s, l) => s + (l._count?.clicks ?? 0), 0)

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: C.surface2, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontFamily: 'sans-serif', fontSize: '.88rem', outline: 'none' }
  const card: React.CSSProperties = { background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 14 }
  const navBtn = (active: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 10, fontSize: '.84rem', fontWeight: active ? 700 : 500, color: active ? '#6c63ff' : C.text2, background: active ? 'rgba(108,99,255,.1)' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' })

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ width: 24, height: 24, border: '2px solid #333', borderTopColor: '#6c63ff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'sans-serif', color: C.text }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: C.surface, border: `1.5px solid ${C.border}`, color: C.text, padding: '10px 22px', borderRadius: 100, fontSize: '.84rem', fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(0,0,0,.3)' }}>
          {toast}
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <aside style={{ width: 220, background: C.surface, borderRight: `1.5px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }} className="desktop-sidebar">
        <div style={{ padding: '16px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div style={{ width: 30, height: 30, background: '#6c63ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 12 }}>M↗</div>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>MultiOpen</span>
        </div>
        <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.text3, padding: '10px 9px 4px' }}>Menu</span>
          {([['links','🔗','My Links'],['analytics','📊','Analytics'],['compose','✍️','Compose'],['accounts','🔌','Accounts']] as const).map(([id, icon, label]) => (
            <button key={id} style={navBtn(view === id)} onClick={() => setView(id as View)}>
              <span style={{ fontSize: '.9rem', width: 16, textAlign: 'center' }}>{icon}</span>{label}
            </button>
          ))}
          <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.text3, padding: '10px 9px 4px' }}>Account</span>
          {([['settings','⚙️','Settings'],['billing','💳','Billing']] as const).map(([id, icon, label]) => (
            <button key={id} style={navBtn(view === id)} onClick={() => setView(id as View)}>
              <span style={{ fontSize: '.9rem', width: 16, textAlign: 'center' }}>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '8px 6px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', color: '#fff', flexShrink: 0 }}>{user.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.77rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '.64rem', color: C.text3, textTransform: 'capitalize' }}>{user.plan}</div>
            </div>
          </div>
          <button style={navBtn(false)} onClick={logout}><span style={{ fontSize: '.9rem', width: 16, textAlign: 'center' }}>↩</span>Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: 70 }}>
        {/* Top bar */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, position: 'sticky', top: 0, zIndex: 10 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.15rem' }}>
            {{ links: 'My Links', analytics: 'Analytics', compose: 'Compose', accounts: 'Accounts', settings: 'Settings', billing: 'Billing', profile: 'Profile' }[view]}
          </h2>
          {view === 'links' && (
            <button style={{ display: 'none' }} className="desktop-new-btn" onClick={() => setShowCreate(true)}>＋ New Link</button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* LINKS */}
          {view === 'links' && <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
              {[{ l: 'Total Links', v: links.length }, { l: 'Clicks', v: totalClicks }, { l: 'Active', v: links.filter(l => l.status === 'active').length }, { l: 'Paused', v: links.filter(l => l.status === 'paused').length }].map(s => (
                <div key={s.l} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem' }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
              {['all', 'active', 'paused'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 100, fontSize: '.77rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: filter === f ? '#6c63ff' : C.border, background: filter === f ? '#6c63ff' : 'transparent', color: filter === f ? '#fff' : C.text2 }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Loading…</div>
              : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: C.text3 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔗</div>
                  <p style={{ fontSize: '.9rem', marginBottom: 14 }}>No links yet. Create your first one!</p>
                </div>
              ) : filtered.map(link => (
                <div key={link.id} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🔗</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.84rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.name ?? link.slug}</div>
                    <a href={link.shortUrl} target="_blank" rel="noopener" style={{ fontSize: '.69rem', color: '#6c63ff', fontFamily: 'monospace', textDecoration: 'none' }}>{link.shortUrl}</a>
                    <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                      {link.targets.map(t => <div key={t.id} style={{ width: 15, height: 15, borderRadius: 3, background: PM[t.platform]?.bg ?? '#555', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.45rem', fontWeight: 800, color: '#fff' }}>{PM[t.platform]?.icon}</div>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <span style={{ padding: '2px 7px', borderRadius: 100, fontSize: '.63rem', fontWeight: 700, background: link.status === 'active' ? 'rgba(67,233,123,.1)' : 'rgba(255,209,102,.1)', color: link.status === 'active' ? '#43e97b' : '#ffd166' }}>{link.status}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button onClick={() => { navigator.clipboard.writeText(link.shortUrl).catch(() => {}); showToast('✓ Copied!') }} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontSize: '.65rem' }}>📋</button>
                      <button onClick={() => toggleStatus(link)} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontSize: '.65rem' }}>{link.status === 'active' ? '⏸' : '▶'}</button>
                      <button onClick={() => deleteLink(link)} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontSize: '.65rem' }}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
          </>}

          {/* ANALYTICS */}
          {view === 'analytics' && (
            analyticsLoading ? <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Loading…</div>
            : !analytics || analytics.totalClicks === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.text3 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
                <h3 style={{ marginBottom: 8, color: C.text2 }}>No data yet</h3>
                <p style={{ fontSize: '.88rem' }}>Share your links to start seeing real analytics here.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
                  {[{ l: 'Clicks', v: analytics.totalClicks }, { l: 'Opens', v: analytics.totalOpens }, { l: 'Open Rate', v: analytics.openRatePct + '%' }, { l: 'Countries', v: analytics.uniqueCountries }].map(s => (
                    <div key={s.l} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>{s.l}</div>
                      <div style={{ fontWeight: 800, fontSize: '1.5rem' }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {analytics.byPlatform?.length > 0 && (
                  <div style={card}>
                    <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 12 }}>Platform Opens</div>
                    {analytics.byPlatform.map((p: any) => (
                      <div key={p.platform} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                        <span style={{ fontSize: '.75rem', color: C.text2, width: 72, textTransform: 'capitalize' }}>{p.platform}</span>
                        <div style={{ flex: 1, height: 5, background: C.surface2, borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${p.pct}%`, background: PM[p.platform]?.bg ?? '#6c63ff', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '.71rem', fontWeight: 700, width: 30, textAlign: 'right' }}>{p.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {analytics.byCountry?.length > 0 && (
                  <div style={card}>
                    <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 12 }}>Countries</div>
                    {analytics.byCountry.map((c: any) => (
                      <div key={c.countryCode} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}`, fontSize: '.82rem' }}>
                        <span style={{ color: C.text2 }}>{c.country}</span>
                        <span style={{ fontWeight: 700 }}>{c.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {analytics.topReferrers?.length > 0 && (
                  <div style={card}>
                    <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 12 }}>Top Referrers</div>
                    {analytics.topReferrers.map((r: any) => (
                      <div key={r.domain} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}`, fontSize: '.82rem' }}>
                        <span style={{ color: C.text2 }}>{r.domain}</span>
                        <span style={{ fontWeight: 700 }}>{r.clicks}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {/* SETTINGS */}
          {view === 'settings' && (
            <div>
              <div style={card}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>Profile</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.text2, marginBottom: 5 }}>Name</label>
                  <input defaultValue={user.name} style={inp} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.text2, marginBottom: 5 }}>Email</label>
                  <input defaultValue={user.email} disabled style={{ ...inp, opacity: .5 }} />
                </div>
                <button style={{ padding: '9px 18px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }} onClick={() => showToast('✓ Saved')}>Save changes</button>
              </div>

              <div style={card}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>Theme</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([['system', '📱', 'System default (follows your phone)'], ['dark', '🌙', 'Dark mode'], ['light', '☀️', 'Light mode']] as const).map(([t, icon, label]) => (
                    <button key={t} onClick={() => changeTheme(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${theme === t ? '#6c63ff' : C.border}`, background: theme === t ? 'rgba(108,99,255,.1)' : 'transparent', color: theme === t ? '#6c63ff' : C.text, cursor: 'pointer', textAlign: 'left', fontWeight: theme === t ? 700 : 400 }}>
                      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                      <span style={{ fontSize: '.88rem' }}>{label}</span>
                      {theme === t && <span style={{ marginLeft: 'auto', fontSize: '.75rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>Change Password</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.text2, marginBottom: 5 }}>Current Password</label>
                  <input type="password" placeholder="••••••••" style={inp} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.text2, marginBottom: 5 }}>New Password</label>
                  <input type="password" placeholder="8+ characters" style={inp} />
                </div>
                <button style={{ padding: '9px 18px', background: 'transparent', color: C.text2, border: `1.5px solid ${C.border}`, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }} onClick={() => showToast('✓ Password updated')}>Update password</button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {view === 'billing' && (
            <div>
              <p style={{ color: C.text2, marginBottom: 16, fontSize: '.88rem' }}>Current plan: <strong style={{ color: C.text, textTransform: 'capitalize' }}>{user.plan}</strong></p>
              {[{ id: 'free', n: 'Free', p: '$0', f: ['10 links', '30 days analytics', '2 accounts'] }, { id: 'pro', n: 'Pro', p: '$12/mo', f: ['200 links', '1 year analytics', '10 accounts', '3 custom domains'], hi: true }, { id: 'team', n: 'Team', p: '$49/mo', f: ['2,000 links', '50 accounts', '20 members'] }].map(plan => (
                <div key={plan.id} style={{ ...card, borderColor: plan.hi ? '#6c63ff' : C.border, background: plan.hi ? 'rgba(108,99,255,.05)' : C.surface }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{plan.n}</div>
                      <div style={{ fontWeight: 800, fontSize: '1.4rem', color: plan.hi ? '#6c63ff' : C.text }}>{plan.p}</div>
                    </div>
                    {user.plan === plan.id
                      ? <span style={{ padding: '4px 10px', background: 'rgba(108,99,255,.1)', borderRadius: 100, fontSize: '.75rem', fontWeight: 700, color: '#6c63ff' }}>Current</span>
                      : <button style={{ padding: '8px 16px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '.82rem' }} onClick={() => showToast('Stripe coming soon')}>Upgrade</button>}
                  </div>
                  <ul style={{ listStyle: 'none' }}>
                    {plan.f.map(f => <li key={f} style={{ display: 'flex', gap: 7, fontSize: '.82rem', marginBottom: 5, color: C.text2 }}><span style={{ color: '#43e97b' }}>✓</span>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* COMPOSE */}
          {view === 'compose' && (
            <div>
              <div style={card}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Caption</div>
                <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} placeholder="Write your post here..." />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={{ padding: '7px 13px', background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.text2, cursor: 'pointer', fontSize: '.79rem' }} onClick={() => showToast('Coming soon')}>📎 Media</button>
                  <button style={{ padding: '7px 13px', background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.text2, cursor: 'pointer', fontSize: '.79rem' }} onClick={() => showToast('Coming soon')}>📅 Schedule</button>
                </div>
              </div>
              <button style={{ width: '100%', padding: 12, background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '.95rem', cursor: 'pointer' }} onClick={() => showToast('Connect accounts first')}>🚀 Publish now</button>
            </div>
          )}

          {/* ACCOUNTS */}
          {view === 'accounts' && (
            <div>
              <p style={{ color: C.text2, marginBottom: 14, fontSize: '.88rem' }}>Connect accounts to publish posts from MultiOpen.</p>
              {Object.entries(PM).filter(([p]) => p !== 'web').map(([p, meta]) => (
                <div key={p} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.85rem', flexShrink: 0 }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', textTransform: 'capitalize' }}>{p}</div>
                    <div style={{ fontSize: '.73rem', color: C.text3 }}>Not connected</div>
                  </div>
                  <button style={{ padding: '6px 12px', background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.text2, cursor: 'pointer', fontSize: '.79rem' }} onClick={() => showToast('OAuth coming soon')}>Connect</button>
                </div>
              ))}
            </div>
          )}

          {/* PROFILE */}
          {view === 'profile' && (
            <div>
              <div style={{ ...card, textAlign: 'center', padding: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.8rem', color: '#fff', margin: '0 auto 12px' }}>{user.name[0]}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.name}</div>
                <div style={{ color: C.text2, fontSize: '.85rem', marginBottom: 4 }}>{user.email}</div>
                <span style={{ padding: '3px 10px', background: 'rgba(108,99,255,.1)', borderRadius: 100, fontSize: '.75rem', fontWeight: 700, color: '#6c63ff', textTransform: 'capitalize' }}>{user.plan} plan</span>
              </div>
              {[['⚙️', 'Settings', () => setView('settings')], ['💳', 'Billing', () => setView('billing')], ['🔌', 'Connected Accounts', () => setView('accounts')]].map(([icon, label, onClick]) => (
                <button key={label as string} onClick={onClick as () => void} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer', border: `1.5px solid ${C.border}` }}>
                  <span style={{ fontSize: '1.1rem' }}>{icon as string}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{label as string}</span>
                  <span style={{ color: C.text3 }}>→</span>
                </button>
              ))}
              <div style={card}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Theme</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([['system', '📱 System'], ['dark', '🌙 Dark'], ['light', '☀️ Light']] as const).map(([t, label]) => (
                    <button key={t} onClick={() => changeTheme(t)} style={{ flex: 1, padding: '8px', borderRadius: 9, border: `1.5px solid ${theme === t ? '#6c63ff' : C.border}`, background: theme === t ? 'rgba(108,99,255,.1)' : 'transparent', color: theme === t ? '#6c63ff' : C.text2, cursor: 'pointer', fontWeight: theme === t ? 700 : 400, fontSize: '.78rem' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button style={{ width: '100%', padding: 12, background: 'rgba(255,71,87,.08)', color: '#ff4757', border: '1.5px solid rgba(255,71,87,.2)', borderRadius: 12, fontWeight: 700, cursor: 'pointer', marginTop: 4 }} onClick={logout}>Sign out</button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', zIndex: 100, height: 60 }} className="bottom-nav">
        <button onClick={() => setView('links')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: view === 'links' ? '#6c63ff' : C.text3 }}>
          <span style={{ fontSize: '1.2rem' }}>🏠</span>
          <span style={{ fontSize: '.6rem', fontWeight: 600 }}>Home</span>
        </button>
        <button onClick={() => setView('analytics')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: view === 'analytics' ? '#6c63ff' : C.text3 }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <span style={{ fontSize: '.6rem', fontWeight: 600 }}>Analytics</span>
        </button>
        {/* Big center create button */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setShowCreate(true)} style={{ width: 52, height: 52, borderRadius: '50%', background: '#6c63ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(108,99,255,.45)', marginTop: -16, color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>+</button>
        </div>
        <button onClick={() => setView('compose')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: view === 'compose' ? '#6c63ff' : C.text3 }}>
          <span style={{ fontSize: '1.2rem' }}>✍️</span>
          <span style={{ fontSize: '.6rem', fontWeight: 600 }}>Compose</span>
        </button>
        <button onClick={() => setView('profile')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: view === 'profile' ? '#6c63ff' : C.text3 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: view === 'profile' ? '#6c63ff' : C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.8rem', color: view === 'profile' ? '#fff' : C.text3 }}>{user.name[0]}</div>
          <span style={{ fontSize: '.6rem', fontWeight: 600 }}>Profile</span>
        </button>
      </div>

      {/* Create Link Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0 }} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem' }}>New MultiOpen Link</h3>
              <button onClick={() => setShowCreate(false)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: C.surface2, color: C.text2, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.text2, marginBottom: 5 }}>Link Name (optional)</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. My morning post" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.text2, marginBottom: 5 }}>Post URLs — paste the social post links</label>
                {urls.map((u, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: PM[u.platform]?.bg ?? '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.65rem', fontWeight: 800, flexShrink: 0 }}>{PM[u.platform]?.icon}</div>
                    <input value={u.url} onChange={e => { const n = [...urls]; n[i] = { ...n[i], url: e.target.value }; setUrls(n) }} placeholder={`https://${u.platform}.com/your-post-url`} style={inp} />
                    {urls.length > 1 && <button onClick={() => setUrls(urls.filter((_, j) => j !== i))} style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', flexShrink: 0 }}>✕</button>}
                  </div>
                ))}
                <button onClick={() => { const opts = ['instagram', 'tiktok', 'youtube', 'linkedin', 'web']; const next = opts.find(p => !urls.find(u => u.platform === p)) ?? 'web'; setUrls([...urls, { platform: next, url: '' }]) }} style={{ width: '100%', padding: 8, background: 'transparent', border: `1.5px dashed ${C.border}`, borderRadius: 10, color: C.text3, cursor: 'pointer', fontSize: '.8rem' }}>＋ Add another platform</button>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.text2, marginBottom: 5 }}>Title (shown on the link page)</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Check out my new post" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.text2, marginBottom: 5 }}>Custom Slug (optional)</label>
                <div style={{ display: 'flex' }}>
                  <span style={{ padding: '11px 10px', background: C.surface2, border: `1.5px solid ${C.border}`, borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: '.73rem', color: C.text3, whiteSpace: 'nowrap' }}>mo.link/</span>
                  <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))} placeholder="my-post" style={{ ...inp, borderRadius: '0 10px 10px 0', flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: '11px', background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text2, cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button style={{ flex: 2, padding: '11px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: creating ? .6 : 1, fontSize: '.95rem' }} onClick={createLink} disabled={creating}>{creating ? 'Creating…' : 'Generate link →'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        .desktop-sidebar{display:flex;}
        .bottom-nav{display:flex;}
        .desktop-new-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;background:#6c63ff;color:#fff;border:none;font-weight:700;font-size:.86rem;cursor:pointer;}
        @media(min-width:769px){
          .bottom-nav{display:none!important;}
          .desktop-sidebar{display:flex!important;}
          .desktop-new-btn{display:inline-flex!important;}
        }
        @media(max-width:768px){
          .desktop-sidebar{display:none!important;}
          .bottom-nav{display:flex!important;}
        }
      `}</style>
    </div>
  )
}
