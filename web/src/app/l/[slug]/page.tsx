import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { detectOS, buildDeepLink, PLATFORM_META } from '@/lib/deeplinks'
import { headers } from 'next/headers'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const link = await prisma.link.findFirst({
    where: { slug: params.slug, status: 'active' }
  })
  if (!link) return { title: 'Link not found' }
  return { title: link.title ?? 'View post', description: link.description ?? undefined }
}

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const headersList = headers()
  const ua = headersList.get('user-agent') ?? ''
  const os = detectOS(ua)

  const link = await prisma.link.findFirst({
    where: {
      slug: params.slug,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      targets: { where: { isEnabled: true }, orderBy: { position: 'asc' } }
    }
  })

  if (!link) notFound()

  // Record page view
  await prisma.click.create({
    data: {
      linkId: link.id,
      deviceType: os === 'android' ? 'android' : os === 'ios' ? 'ios' : 'desktop',
    }
  }).catch(() => {})

  const targets = link.targets.map(t => {
    const meta = PLATFORM_META[t.platform as keyof typeof PLATFORM_META] ?? PLATFORM_META.web
    return {
      id: t.id,
      platform: t.platform,
      canonicalUrl: t.canonicalUrl,
      deepLinkUri: buildDeepLink(t.platform as any, t.canonicalUrl, os) ?? null,
      label: meta.label,
      subLabel: meta.subLabel,
      brandColor: meta.brandColor,
      bgColor: meta.bgColor,
      iconChar: meta.iconChar,
    }
  })

  const css = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:sans-serif;background:#0c0c0f;color:#f0f0f5;display:flex;justify-content:center;min-height:100vh;}.wrap{width:100%;max-width:430px;min-height:100vh;background:#141418;display:flex;flex-direction:column;}.top{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a2a35;}.dom{font-family:monospace;font-size:.75rem;color:#5a5a70;}.back{padding:6px 12px;background:transparent;border:1.5px solid #2a2a35;border-radius:8px;color:#9090a8;font-size:.78rem;text-decoration:none;}.card{margin:14px;background:#1c1c22;border-radius:14px;overflow:hidden;border:1px solid #2a2a35;}.img{height:160px;background:linear-gradient(135deg,#0f0c29,#302b63);display:flex;align-items:center;justify-content:center;font-size:2.5rem;}.cbody{padding:14px;}.ptitle{font-size:.95rem;font-weight:700;line-height:1.3;margin-bottom:5px;}.pdesc{font-size:.77rem;color:#9090a8;line-height:1.5;}.lbl{padding:6px 16px 8px;font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5a5a70;}.btns{padding:0 14px;display:flex;flex-direction:column;gap:9px;}.pbtn{display:flex;align-items:center;gap:11px;padding:13px 14px;border-radius:13px;border:none;cursor:pointer;font-family:sans-serif;font-size:.88rem;font-weight:600;width:100%;text-align:left;transition:transform .2s;}.pbtn:hover{transform:translateX(4px);}.ico{width:36px;height:36px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;flex-shrink:0;color:#fff;}.btxt{flex:1;}.blbl{display:block;font-weight:700;font-size:.84rem;}.bsub{display:block;font-size:.67rem;opacity:.5;margin-top:1px;}.acts{display:flex;gap:9px;padding:14px;}.act{flex:1;padding:10px;border-radius:10px;border:1.5px solid #2a2a35;background:transparent;color:#9090a8;font-family:sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .15s;}.act:hover{background:#1c1c22;color:#f0f0f5;}.rep{display:block;text-align:center;font-size:.7rem;color:#5a5a70;padding:8px;cursor:pointer;background:none;border:none;width:100%;}.pw{text-align:center;font-size:.67rem;color:#5a5a70;padding:13px;border-top:1px solid #2a2a35;}.fb{margin:0 14px 8px;background:rgba(255,209,102,.07);border:1px solid rgba(255,209,102,.18);border-radius:10px;padding:11px 13px;font-size:.77rem;color:#ffd166;display:none;}`

  const targetsJson = JSON.stringify(targets)
  const slug = params.slug
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  const script = `
var TARGETS = ${targetsJson};
var SLUG = "${slug}";
var BASE = "${base}";

function handleOpen(idx) {
  var t = TARGETS[idx];
  if (!t) return;
  fetch('/api/links/' + SLUG + '/click', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({targetId: t.id, platform: t.platform})
  }).catch(function(){});
  if (!t.deepLinkUri || t.platform === 'web') {
    window.open(t.canonicalUrl, '_blank', 'noopener');
    return;
  }
  var ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    window.location.href = t.deepLinkUri;
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    window.location.href = t.deepLinkUri;
    setTimeout(function() {
      var fb = document.getElementById('fbbar');
      if (fb) fb.style.display = 'block';
    }, 1800);
  } else {
    window.open(t.canonicalUrl, '_blank', 'noopener');
  }
}

function copyLink() {
  var url = BASE + '/l/' + SLUG;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function(){ alert('Link copied!'); }).catch(function(){ alert('Copy: ' + url); });
  } else {
    alert('Copy this link: ' + url);
  }
}

function shareLink() {
  var url = BASE + '/l/' + SLUG;
  if (navigator.share) {
    navigator.share({title: document.title, url: url}).catch(function(){});
  } else {
    copyLink();
  }
}
  `

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
        <title>{link.title ?? 'View post'}</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="wrap">
          <div className="top">
            <span className="dom">mo.link/{params.slug}</span>
            <a href="/" className="back">← MultiOpen</a>
          </div>

          <div className="card">
            <div className="img">🎬</div>
            <div className="cbody">
              <div className="ptitle">{link.title ?? 'View this post'}</div>
              {link.description && <div className="pdesc">{link.description}</div>}
            </div>
          </div>

          <div id="fbbar" className="fb">
            App may not be installed. Try opening in your browser instead.
          </div>

          <div className="lbl">Open this post in…</div>

          <div className="btns">
            {targets.map((t, idx) => (
              <button
                key={t.id}
                className="pbtn"
                style={{ background: t.bgColor, color: t.brandColor }}
                onClick={`handleOpen(${idx})`as any}
              >
                <div className="ico" style={{ background: t.brandColor }}>{t.iconChar}</div>
                <div className="btxt">
                  <span className="blbl">{t.label}</span>
                  <span className="bsub">{t.subLabel}</span>
                </div>
                <span style={{ opacity: .3 }}>→</span>
              </button>
            ))}
          </div>

          <div className="acts">
            <button className="act" onClick={"copyLink()" as any}>📋 Copy link</button>
            <button className="act" onClick={"shareLink()" as any}>↗ Share</button>
          </div>

          <button className="rep" onClick={"alert('Report submitted. Thank you.')" as any}>
            ⚑ Report this link
          </button>

          <div className="pw">Powered by <strong style={{ color: '#9090a8' }}>MultiOpen</strong></div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </body>
    </html>
  )
}
