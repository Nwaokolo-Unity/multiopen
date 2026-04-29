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

const VIEWS = [
  { id: 'links', icon: '🔗', label: 'My Links' },
  { id: 'analytics', icon: '📊', label: 'Analytics' },
  { id: 'compose', icon: '✍️', label: 'Compose' },
  { id: 'accounts', icon: '🔌', label: 'Accounts' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
  { id: 'billing', icon: '💳', label: 'Billing' },
]

const TITLES: Record<string, string> = {
  links: 'My Links', analytics: 'Analytics', compose: 'Compose & Publish',
  accounts: 'Connected Accounts', settings: 'Settings', billing: 'Billing'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  // Create form
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [urls, setUrls] = useState([{ platform: 'facebook', url: '' }, { platform: 'x', url: '' }])
  const [creating, setCreating] = useState(false)

  const isDark = theme === 'dark'
  const T = {
    bg: isDark ? '#0c0c0f' : '#f5f5f5',
    surface: isDark ? '#141418' : '#ffffff',
    surface2: isDark ? '#1c1c22' : '#f0f0f0',
    border: isDark ? '#2a2a35' : '#e0e0e0',
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

  const fetchAnalytics = useCallback(() => {
    setAnalyticsLoading(true)
    fetch('/api/analytics/overview?days=30')
      .then(r => r.ok ? r.json() : null)
      .then(setAnalytics)
      .finally(() => setAnalyticsLoading(false))
  }, [])

  useEffect(() => {
    if (view === 'analytics') fetchAnalytics()
  }, [view, fetchAnalytics])

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
      showToast('✓ Link created! → ' + data.shortUrl)
    } finally { setCreating(false) }
  }

  const filtered = links.filter(l => filter === 'all' || l.status === filter)
  const totalClicks = links.reduce((s, l) => s + (l._count?.clicks ?? 0), 0)

  const navBtn = (active: boolean) => ({
    display: 'flex' as const, alignItems: 'center' as const, gap: 9,
    padding: '9px 10px', borderRadius: 10, fontSize: '.84rem',
    fontWeight: active ? 700 : 500, color: active ? '#6c63ff' : T.text2,
    background: active ? 'rgba(108,99,255,.1)' : 'transparent',
    border: 'none', cursor: 'pointer' as const, width: '100%', textAlign: 'left' as const,
  })

  const inputStyle = {
    width: '100%', padding: '11px 14px', background: T.surface2,
    border: `1.5px solid ${T.border}`, borderRadius: 10, color: T.text,
    fontFamily: 'sans-serif', fontSize: '.88rem', outline: 'none',
  }

  const cardStyle = {
    background: T.surface, border: `1.5px solid ${T.border}`,
    borderRadius: 14, padding: 18, marginBottom: 14,
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <div style={{ width: 24, height: 24, border: '2px solid #2a2a35', borderTopColor: '#6c63ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'sans-serif', color: T.text, position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: T.surface, border: `1.5px solid ${T.border}`, color: T.text, padding: '10px 22px', borderRadius: 100, fontSize: '.84rem', fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap' as const, boxShadow: '0 4px 24px rgba(0,0,0,.3)' }}>
          {toast}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 150 }} />
      )}

      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 201, width: 38, height: 38, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 10, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem' }}
        id="hamburger">☰</button>

      {/* Sidebar */}
      <aside style={{ width: 220, background: T.surface, borderRight: `1.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky' as const, top: 0, overflow: 'hidden' }}
        id="sidebar">
        <div style={{ padding: '16px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => router.push('/')}>
            <div style={{ width: 30, height: 30, background: '#6c63ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 12 }}>M↗</div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>MultiOpen</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} id="sb-close" style={{ background: 'none', border: 'none', color: T.text2, cursor: 'pointer', fontSize: '1rem', display: 'none' }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: T.text3, padding: '10px 9px 4px' }}>Menu</span>
          {VIEWS.map(v => (
            <button key={v.id} style={navBtn(view === v.id)} onClick={() => { setView(v.id); setSidebarOpen(false) }}>
              <span style={{ fontSize: '.9rem', width: 16, textAlign: 'center' as const }}>{v.icon}</span>{v.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '8px 6px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 10px', borderRadius: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', color: '#fff', flexShrink: 0 }}>{user.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.77rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{user.name}</div>
              <div style={{ fontSize: '.64rem', color: T.text3, textTransform: 'capitalize' as const }}>{user.plan} plan</div>
            </div>
          </div>
          <button style={navBtn(false)} onClick={() => { setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
            <span style={{ fontSize: '.9rem', width: 16, textAlign: 'center' as const }}>{isDark ? '☀️' : '🌙'}</span>{isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <button style={navBtn(false)} onClick={logout}><span style={{ fontSize: '.9rem', width: 16, textAlign: 'center' as const }}>↩</span>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bg, position: 'sticky' as const, top: 0, zIndex: 10, gap: 12, flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24 }} />
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>{TITLES[view] ?? view}</h2>
          </div>
          {view === 'links' && (
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: '#6c63ff', color: '#fff', border: 'none', fontWeight: 700, fontSize: '.86rem', cursor: 'pointer' }} onClick={() => setShowCreate(true)}>
              ＋ New Link
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' as const, padding: 20 }}>

          {/* LINKS */}
          {view === 'links' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
                {[{ l: 'Total Links', v: links.length }, { l: 'Total Clicks', v: totalClicks }, { l: 'Active', v: links.filter(l => l.status === 'active').length }, { l: 'Paused', v: links.filter(l => l.status === 'paused').length }].map(s => (
                  <div key={s.l} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: T.text3, marginBottom: 5 }}>{s.l}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.6rem' }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                {['all', 'active', 'paused'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 100, fontSize: '.77rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: filter === f ? '#6c63ff' : T.border, background: filter === f ? '#6c63ff' : 'transparent', color: filter === f ? '#fff' : T.text2 }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {loading ? <div style={{ textAlign: 'center', padding: 40, color: T.text3 }}>Loading…</div>
                : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: T.text3 }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔗</div>
                    <p style={{ marginBottom: 14, fontSize: '.9rem' }}>No links yet. Create your first one!</p>
                    <button style={{ padding: '9px 18px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowCreate(true)}>Create a link</button>
                  </div>
                ) : filtered.map(link => (
                  <div key={link.id} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' as const }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🔗</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{link.name ?? link.slug}</div>
                      <a href={link.shortUrl} target="_blank" rel="noopener" style={{ fontSize: '.7rem', color: '#6c63ff', fontFamily: 'monospace', textDecoration: 'none' }}>{link.shortUrl}</a>
                      <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                        {link.targets.map(t => (
                          <div key={t.id} style={{ width: 16, height: 16, borderRadius: 3, background: PM[t.platform]?.bg ?? '#555', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.48rem', fontWeight: 800, color: '#fff' }}>{PM[t.platform]?.icon}</div>
                        ))}
                      </div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: '.66rem', fontWeight: 700, background: link.status === 'active' ? 'rgba(67,233,123,.1)' : 'rgba(255,209,102,.1)', color: link.status === 'active' ? '#43e97b' : '#ffd166', flexShrink: 0 }}>{link.status}</span>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => { navigator.clipboard.writeText(link.shortUrl).catch(() => {}); showToast('✓ Copied!') }} style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: '.7rem' }}>📋</button>
                      <button onClick={() => toggleStatus(link)} style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: '.7rem' }}>{link.status === 'active' ? '⏸' : '▶'}</button>
                      <button onClick={() => deleteLink(link)} style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: '.7rem' }}>🗑</button>
                    </div>
                  </div>
                ))}
            </>
          )}

          {/* ANALYTICS - REAL DATA */}
          {view === 'analytics' && (
            <div>
              {analyticsLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: T.text3 }}>Loading analytics…</div>
              ) : !analytics ? (
                <div style={{ textAlign: 'center', padding: 40, color: T.text3 }}>No data yet. Share your links to start tracking.</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
                    {[
                      { l: 'Total Clicks', v: analytics.totalClicks },
                      { l: 'App Opens', v: analytics.totalOpens },
                      { l: 'Open Rate', v: analytics.openRatePct + '%' },
                      { l: 'Countries', v: analytics.uniqueCountries },
                    ].map(s => (
                      <div key={s.l} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.07em', color: T.text3, marginBottom: 5 }}>{s.l}</div>
                        <div style={{ fontWeight: 800, fontSize: '1.6rem' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {analytics.totalClicks === 0 ? (
                    <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: T.text3 }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                      <p>No clicks yet. Share your links to see real analytics here.</p>
                    </div>
                  ) : (
                    <>
                      {analytics.byPlatform?.length > 0 && (
                        <div style={cardStyle}>
                          <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 14 }}>Platform Opens</div>
                          {analytics.byPlatform.map((p: any) => (
                            <div key={p.platform} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                              <span style={{ fontSize: '.77rem', color: T.text2, width: 80, textTransform: 'capitalize' as const }}>{p.platform}</span>
                              <div style={{ flex: 1, height: 5, background: T.surface2, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${p.pct}%`, background: PM[p.platform]?.bg ?? '#6c63ff', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: '.72rem', fontWeight: 700, width: 32, textAlign: 'right' as const }}>{p.pct}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {analytics.byDevice?.length > 0 && (
                          <div style={cardStyle}>
                            <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 12 }}>Devices</div>
                            {analytics.byDevice.map((d: any) => (
                              <div key={d.device} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: '.77rem', color: T.text2, flex: 1, textTransform: 'capitalize' as const }}>{d.device}</span>
                                <span style={{ fontSize: '.72rem', fontWeight: 700 }}>{d.pct}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {analytics.byCountry?.length > 0 && (
                          <div style={cardStyle}>
                            <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 12 }}>Countries</div>
                            {analytics.byCountry.map((c: any) => (
                              <div key={c.countryCode} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ flex: 1, fontSize: '.77rem', color: T.text2 }}>{c.country}</span>
                                <span style={{ fontSize: '.72rem', fontWeight: 700 }}>{c.pct}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {analytics.topReferrers?.length > 0 && (
                        <div style={cardStyle}>
                          <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: 12 }}>Top Referrers</div>
                          {analytics.topReferrers.map((r: any) => (
                            <div key={r.domain} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: '.82rem' }}>
                              <span style={{ color: T.text2 }}>{r.domain}</span>
                              <span style={{ fontWeight: 700 }}>{r.clicks}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {view === 'settings' && (
            <div style={{ maxWidth: 480 }}>
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 16 }}>Profile</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.06em', color: T.text2, marginBottom: 5 }}>Name</label>
                  <input defaultValue={user.name} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.06em', color: T.text2, marginBottom: 5 }}>Email</label>
                  <input defaultValue={user.email} disabled style={{ ...inputStyle, opacity: .45 }} />
                </div>
                <button style={{ padding: '9px 18px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }} onClick={() => showToast('✓ Saved')}>Save changes</button>
              </div>
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 16 }}>Theme</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['dark', 'light'] as const).map(t => (
                    <button key={t} onClick={() => setTheme(t)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${theme === t ? '#6c63ff' : T.border}`, background: theme === t ? 'rgba(108,99,255,.1)' : 'transparent', color: theme === t ? '#6c63ff' : T.text2, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' as const }}>
                      {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 16 }}>Change Password</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: T.text2, marginBottom: 5 }}>Current Password</label>
                  <input type="password" placeholder="••••••••" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: T.text2, marginBottom: 5 }}>New Password</label>
                  <input type="password" placeholder="8+ characters" style={inputStyle} />
                </div>
                <button style={{ padding: '9px 18px', background: 'transparent', color: T.text2, border: `1.5px solid ${T.border}`, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }} onClick={() => showToast('✓ Password updated')}>Update password</button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {view === 'billing' && (
            <div>
              <p style={{ color: T.text2, marginBottom: 20 }}>Current plan: <strong style={{ color: T.text, textTransform: 'capitalize' }}>{user.plan}</strong></p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {[{ id: 'free', n: 'Free', p: '$0', f: ['10 links', '30 days analytics', '2 accounts'] }, { id: 'pro', n: 'Pro', p: '$12/mo', f: ['200 links', '1 year analytics', '10 accounts', '3 domains'], hi: true }, { id: 'team', n: 'Team', p: '$49/mo', f: ['2,000 links', '50 accounts', '20 members'] }].map(plan => (
                  <div key={plan.id} style={{ ...cardStyle, borderColor: plan.hi ? '#6c63ff' : T.border, background: plan.hi ? 'rgba(108,99,255,.05)' : T.surface }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: plan.hi ? '#6c63ff' : T.text3, fontSize: '.8rem', textTransform: 'uppercase' as const }}>{plan.n}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 14 }}>{plan.p}</div>
                    <ul style={{ listStyle: 'none', marginBottom: 16 }}>
                      {plan.f.map(f => <li key={f} style={{ display: 'flex', gap: 7, fontSize: '.82rem', marginBottom: 5, color: T.text2 }}><span style={{ color: '#43e97b' }}>✓</span>{f}</li>)}
                    </ul>
                    {user.plan === plan.id
                      ? <div style={{ textAlign: 'center', padding: 8, background: 'rgba(108,99,255,.1)', borderRadius: 9, fontSize: '.79rem', fontWeight: 700, color: '#6c63ff' }}>✓ Current plan</div>
                      : <button style={{ width: '100%', padding: 10, background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }} onClick={() => showToast('Stripe coming soon')}>Upgrade</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPOSE */}
          {view === 'compose' && (
            <div style={{ maxWidth: 600 }}>
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Caption</div>
                <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' as const }} placeholder="Write your post here..." />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={{ padding: '7px 13px', background: 'transparent', border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text2, cursor: 'pointer', fontSize: '.79rem' }} onClick={() => showToast('Coming soon')}>📎 Media</button>
                  <button style={{ padding: '7px 13px', background: 'transparent', border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text2, cursor: 'pointer', fontSize: '.79rem' }} onClick={() => showToast('Coming soon')}>📅 Schedule</button>
                </div>
              </div>
              <button style={{ width: '100%', padding: 12, background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }} onClick={() => showToast('Connect accounts first')}>🚀 Publish now</button>
            </div>
          )}

          {/* ACCOUNTS */}
          {view === 'accounts' && (
            <div>
              <p style={{ color: T.text2, marginBottom: 16, fontSize: '.88rem' }}>Connect accounts to publish posts from MultiOpen.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {Object.entries(PM).filter(([p]) => p !== 'web').map(([p, meta]) => (
                  <div key={p} style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.85rem' }}>{meta.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '.88rem', textTransform: 'capitalize' as const }}>{p}</div>
                        <div style={{ fontSize: '.73rem', color: T.text3 }}>Not connected</div>
                      </div>
                      <button style={{ padding: '6px 12px', background: 'transparent', border: `1.5px solid ${T.border}`, borderRadius: 9, color: T.text2, cursor: 'pointer', fontSize: '.79rem' }} onClick={() => showToast('OAuth coming soon')}>Connect</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Link Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem' }}>Create MultiOpen Link</h3>
              <button onClick={() => setShowCreate(false)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: T.surface2, color: T.text2, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: T.text2, marginBottom: 5 }}>Link Name (optional)</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. My morning post" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: T.text2, marginBottom: 5 }}>Post URLs</label>
                {urls.map((u, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: PM[u.platform]?.bg ?? '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.65rem', fontWeight: 800, flexShrink: 0 }}>{PM[u.platform]?.icon}</div>
                    <input value={u.url} onChange={e => { const n = [...urls]; n[i].url = e.target.value; setUrls(n) }} placeholder={`https://${u.platform}.com/...`} style={{ ...inputStyle }} />
                    {urls.length > 1 && <button onClick={() => setUrls(urls.filter((_, j) => j !== i))} style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', flexShrink: 0 }}>✕</button>}
                  </div>
                ))}
                <button onClick={() => { const opts = ['instagram', 'tiktok', 'youtube', 'linkedin', 'web']; const next = opts.find(p => !urls.find(u => u.platform === p)) ?? 'web'; setUrls([...urls, { platform: next, url: '' }]) }}
                  style={{ width: '100%', padding: 8, background: 'transparent', border: `1.5px dashed ${T.border}`, borderRadius: 10, color: T.text3, cursor: 'pointer', fontSize: '.8rem' }}>
                  ＋ Add another platform
                </button>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: T.text2, marginBottom: 5 }}>Preview Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Auto-fetched or enter manually" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: T.text2, marginBottom: 5 }}>Custom Slug (optional)</label>
                <div style={{ display: 'flex' }}>
                  <span style={{ padding: '11px 10px', background: T.surface2, border: `1.5px solid ${T.border}`, borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: '.75rem', color: T.text3, whiteSpace: 'nowrap' as const }}>mo.link/</span>
                  <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))} placeholder="my-post" style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={{ padding: '9px 16px', background: 'transparent', border: `1.5px solid ${T.border}`, borderRadius: 10, color: T.text2, cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button style={{ padding: '9px 18px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: creating ? .6 : 1 }} onClick={createLink} disabled={creating}>{creating ? 'Creating…' : 'Generate link →'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        @media(max-width:768px){
          #sidebar{position:fixed!important;left:0;top:0;bottom:0;z-index:160;transform:${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'}!important;transition:transform .3s;width:240px!important;}
          #hamburger{display:flex!important;}
          #sb-close{display:block!important;}
        }
      `}</style>
    </div>
  )
}
