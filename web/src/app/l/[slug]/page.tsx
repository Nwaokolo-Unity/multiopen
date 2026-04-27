import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://multiopen-universe.vercel.app'

async function getPayload(slug: string) {
  try {
    const res = await fetch(`${BASE}/api/links/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getPayload(params.slug)
  if (!d) return { title: 'Link not found' }
  return { title: d.link?.title ?? 'View post', description: d.link?.description }
}

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const d = await getPayload(params.slug)
  if (!d) notFound()
  const { link, targets } = d

  const css = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:sans-serif;background:#0c0c0f;color:#f0f0f5;display:flex;justify-content:center;}.wrap{width:100%;max-width:430px;min-height:100vh;background:#141418;border-left:1px solid #2a2a35;border-right:1px solid #2a2a35;display:flex;flex-direction:column;}.top{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a2a35;}.dom{font-family:monospace;font-size:.75rem;color:#5a5a70;}.back{padding:6px 12px;background:transparent;border:1.5px solid #2a2a35;border-radius:8px;color:#9090a8;font-family:sans-serif;font-size:.78rem;text-decoration:none;}.card{margin:14px;background:#1c1c22;border-radius:14px;overflow:hidden;border:1px solid #2a2a35;}.img{height:170px;background:linear-gradient(135deg,#0f0c29,#302b63);display:flex;align-items:center;justify-content:center;font-size:2.8rem;}.body{padding:14px;}.ptitle{font-size:.95rem;font-weight:700;line-height:1.3;margin-bottom:5px;}.pdesc{font-size:.77rem;color:#9090a8;line-height:1.5;}.lbl{padding:6px 16px 8px;font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5a5a70;}.btns{padding:0 14px;display:flex;flex-direction:column;gap:9px;}.pbtn{display:flex;align-items:center;gap:11px;padding:13px 14px;border-radius:13px;border:none;cursor:pointer;font-family:sans-serif;font-size:.88rem;font-weight:600;width:100%;text-align:left;}.ico{width:36px;height:36px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;flex-shrink:0;color:#fff;}.btxt{flex:1;}.blbl{display:block;font-weight:700;font-size:.84rem;}.bsub{display:block;font-size:.67rem;opacity:.5;margin-top:1px;}.acts{display:flex;gap:9px;padding:14px;}.act{flex:1;padding:10px;border-radius:10px;border:1.5px solid #2a2a35;background:transparent;color:#9090a8;font-family:sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;}.rep{display:block;text-align:center;font-size:.7rem;color:#5a5a70;padding:8px;cursor:pointer;background:none;border:none;width:100%;}.pw{text-align:center;font-size:.67rem;color:#5a5a70;padding:13px;border-top:1px solid #2a2a35;}`

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{link.title ?? 'View post'}</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="wrap">
          <div className="top">
            <span className="dom">mo.link/{params.slug}</span>
            <a href="/" className="back">Back</a>
          </div>
          <div className="card">
            <div className="img">🎬</div>
            <div className="body">
              <div className="ptitle">{link.title}</div>
              {link.description && <div className="pdesc">{link.description}</div>}
            </div>
          </div>
          <div className="lbl">Open this post in</div>
          <div className="btns">
            {(targets as any[]).map((t: any) => (
              <button
                key={t.id}
                className="pbtn"
                style={{ background: 'rgba(108,99,255,.1)', color: '#f0f0f5' }}
                onClick={() => {
                  fetch('/api/links/' + params.slug + '/click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetId: t.id, platform: t.platform })
                  }).catch(() => {})
                  if (!t.deepLinkUri || t.platform === 'web') {
                    window.open(t.canonicalUrl, '_blank', 'noopener')
                  } else {
                    window.location.href = t.deepLinkUri
                  }
                }}
              >
                <div className="ico" style={{ background: t.brandColor }}>{t.iconChar}</div>
                <div className="btxt">
                  <span className="blbl">{t.label}</span>
                  <span className="bsub">{t.subLabel}</span>
                </div>
                <span>→</span>
              </button>
            ))}
          </div>
          <div className="acts">
            <button className="act" onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); alert('Copied!') }}>
              Copy link
            </button>
            <button className="act" onClick={() => { if (navigator.share) { navigator.share({ url: window.location.href }).catch(() => {}) } }}>
              Share
            </button>
          </div>
          <button className="rep" onClick={() => alert('Report submitted.')}>Report this link</button>
          <div className="pw">Powered by MultiOpen</div>
        </div>
      </body>
    </html>
  )
}
