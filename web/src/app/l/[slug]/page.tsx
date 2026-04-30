import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { detectOS, buildDeepLink, PLATFORM_META } from '@/lib/deeplinks'
import { headers } from 'next/headers'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const link = await prisma.link.findFirst({ where: { slug: params.slug, status: 'active' } })
  if (!link) return { title: 'Link not found' }
  return { title: link.title ?? 'View post', description: link.description ?? undefined }
}

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const headersList = headers()
  const ua = headersList.get('user-agent') ?? ''
  const os = detectOS(ua)

  const link = await prisma.link.findFirst({
    where: { slug: params.slug, status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { targets: { where: { isEnabled: true }, orderBy: { position: 'asc' } } }
  })
  if (!link) notFound()

  await prisma.click.create({
    data: { linkId: link.id, deviceType: os === 'android' ? 'android' : os === 'ios' ? 'ios' : 'desktop' }
  }).catch(() => {})

  const targets = link.targets.map(t => {
    const meta = PLATFORM_META[t.platform as keyof typeof PLATFORM_META] ?? PLATFORM_META.web
    const deepLink = buildDeepLink(t.platform as any, t.canonicalUrl, os)
    return {
      id: t.id,
      platform: t.platform,
      canonicalUrl: t.canonicalUrl,
      deepLinkUri: deepLink,
      label: meta.label,
      subLabel: meta.subLabel,
      brandColor: meta.brandColor,
      bgColor: meta.bgColor,
      iconChar: meta.iconChar,
    }
  })

  const slug = params.slug
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  const css = `
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:sans-serif;background:#0c0c0f;color:#f0f0f5;display:flex;justify-content:center;min-height:100vh;}
    .wrap{width:100%;max-width:430px;min-height:100vh;background:#141418;display:flex;flex-direction:column;}
    .top{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a2a35;}
    .dom{font-family:monospace;font-size:.75rem;color:#5a5a70;}
    .back{padding:6px 12px;background:transparent;border:1.5px solid #2a2a35;border-radius:8px;color:#9090a8;font-size:.78rem;text-decoration:none;cursor:pointer;}
    .card{margin:14px;background:#1c1c22;border-radius:14px;overflow:hidden;border:1px solid #2a2a35;}
    .img{height:160px;background:linear-gradient(135deg,#0f0c29,#302b63);display:flex;align-items:center;justify-content:center;font-size:2.5rem;}
    .cbody{padding:14px;}
    .ptitle{font-size:.95rem;font-weight:700;line-height:1.3;margin-bottom:5px;}
    .pdesc{font-size:.77rem;color:#9090a8;line-height:1.5;}
    .lbl{padding:6px 16px 8px;font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5a5a70;}
    .btns{padding:0 14px;display:flex;flex-direction:column;gap:9px;}
    .pbtn{display:flex;align-items:center;gap:11px;padding:14px;border-radius:13px;border:none;cursor:pointer;font-family:sans-serif;font-size:.88rem;font-weight:600;width:100%;text-align:left;transition:transform .15s;}
    .pbtn:active{transform:scale(.98);}
    .ico{width:36px;height:36px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;flex-shrink:0;color:#fff;}
    .btxt{flex:1;}
    .blbl{display:block;font-weight:700;font-size:.84rem;}
    .bsub{display:block;font-size:.67rem;opacity:.5;margin-top:1px;}
    .acts{display:flex;gap:9px;padding:14px;}
    .act{flex:1;padding:10px;border-radius:10px;border:1.5px solid #2a2a35;background:transparent;color:#9090a8;font-family:sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;}
    .rep{display:block;text-align:center;font-size:.7rem;color:#5a5a70;padding:8px;cursor:pointer;background:none;border:none;width:100%;}
    .pw{text-align:center;font-size:.67rem;color:#5a5a70;padding:13px;border-top:1px solid #2a2a35;}
    .fbbar{display:none;margin:8px 14px;background:rgba(255,209,102,.07);border:1px solid rgba(255,209,102,.18);border-radius:10px;padding:11px 13px;font-size:.77rem;color:#ffd166;gap:8px;}
    .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#141418;border:1px solid #2a2a35;color:#f0f0f5;padding:10px 20px;border-radius:100px;font-size:.82rem;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap;}
    .toast.show{opacity:1;}
  `

  // Build targets JSON for client script - safe serialization
  const targetsData = targets.map(t => ({
    id: t.id,
    platform: t.platform,
    canonicalUrl: t.canonicalUrl,
    deepLinkUri: t.deepLinkUri || null,
  }))

  const script = `
(function() {
  var TARGETS = ${JSON.stringify(targetsData)};
  var SLUG = ${JSON.stringify(slug)};
  var BASE = ${JSON.stringify(base)};

  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
  }

  function handleOpen(idx) {
    var t = TARGETS[idx];
    if (!t) return;

    // Record click
    fetch('/api/links/' + SLUG + '/click', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({targetId: t.id, platform: t.platform})
    }).catch(function(){});

    // Make sure URL has protocol
    var webUrl = t.canonicalUrl;
    if (webUrl && !webUrl.startsWith('http')) {
      webUrl = 'https://' + webUrl;
    }

    // No deep link or web platform - open in browser
    if (!t.deepLinkUri || t.platform === 'web') {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      showToast('Opening in browser...');
      return;
    }

    var ua = navigator.userAgent;
    var isAndroid = /android/i.test(ua);
    var isIOS = /iphone|ipad|ipod/i.test(ua);

    if (isAndroid || isIOS) {
      // Try native app first
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Set a timer - if app doesn't open in 1.5s, open browser
      var timer = setTimeout(function() {
        document.body.removeChild(iframe);
        window.open(webUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening in browser...');
      }, 1500);

      // Listen for page losing focus (app opened)
      window.addEventListener('blur', function onBlur() {
        clearTimeout(timer);
        document.body.removeChild(iframe);
        window.removeEventListener('blur', onBlur);
        showToast('Opening app...');
      }, {once: true});

      iframe.src = t.deepLinkUri;
    } else {
      // Desktop - just open web URL
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      showToast('Opening in browser...');
    }
  }

  function copyLink() {
    var url = BASE + '/l/' + SLUG;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(function() { showToast('Link copied!'); })
        .catch(function() { showToast('Copy: ' + url); });
    } else {
      showToast('Link: ' + url);
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

  // Attach to window so inline handlers work
  window.handleOpen = handleOpen;
  window.copyLink = copyLink;
  window.shareLink = shareLink;
})();
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
            <a href="/" className="back">← Back</a>
          </div>

          <div className="card">
            <div className="img">🎬</div>
            <div className="cbody">
              <div className="ptitle">{link.title ?? 'View this post'}</div>
              {link.description && <div className="pdesc">{link.description}</div>}
            </div>
          </div>

          <div className="lbl">Open this post in…</div>

          <div className="btns">
            {targets.map((t, idx) => (
              <button
                key={t.id}
                className="pbtn"
                style={{ background: t.bgColor, color: t.brandColor }}
                onClick={`window.handleOpen(${idx})` as any}
              >
                <div className="ico" style={{ background: t.brandColor }}>{t.iconChar}</div>
                <div className="btxt">
                  <span className="blbl">{t.label}</span>
                  <span className="bsub">{t.subLabel}</span>
                </div>
                <span style={{ opacity: .35, fontSize: '.85rem' }}>→</span>
              </button>
            ))}
          </div>

          <div className="acts">
            <button className="act" onClick={"window.copyLink()" as any}>📋 Copy link</button>
            <button className="act" onClick={"window.shareLink()" as any}>↗ Share</button>
          </div>

          <button className="rep" onClick={"alert('Report submitted. Thank you.')" as any}>
            ⚑ Report this link
          </button>

          <div className="pw">Powered by <strong style={{ color: '#9090a8' }}>MultiOpen</strong></div>
        </div>

        <div id="toast" className="toast"></div>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </body>
    </html>
  )
}
