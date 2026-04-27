import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://multiopen.vercel.app'

async function getPayload(slug: string) {
  try {
    const res = await fetch(`${BASE}/api/links/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
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

  const BG: Record<string,string> = { facebook:'rgba(24,119,242,.1)', x:'rgba(255,255,255,.05)', instagram:'rgba(225,48,108,.1)', tiktok:'rgba(255,255,255,.03)', youtube:'rgba(255,0,0,.08)', linkedin:'rgba(0,119,181,.1)', web:'rgba(255,255,255,.02)' }

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>{link.title ?? 'View post'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@700&family=Cabinet+Grotesk:wght@400;600;700&display=swap" rel="stylesheet"/>
        <style>{`*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Cabinet Grotesk',sans-serif;background:#0c0c0f;color:#f0f0f5;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;}.wrap{width:100%;max-width:430px;min-height:100vh;background:#141418;border-left:1px solid #2a2a35;border-right:1px solid #2a2a35;display:flex;flex-direction:column;}.top{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a2a35;}.dom{font-family:monospace;font-size:.75rem;color:#5a5a70;}.back{padding:6px 12px;background:transparent;border:1.5px solid #2a2a35;border-radius:8px;color:#9090a8;font-family:'Cabinet Grotesk',sans-serif;font-size:.78rem;cursor:pointer;text-decoration:none;}.card{margin:14px;background:#1c1c22;border-radius:14px;overflow:hidden;border:1px solid #2a2a35;}.img{height:170px;background:linear-gradient(135deg,#0f0c29,#302b63);display:flex;align-items:center;justify-content:center;font-size:2.8rem;}.body{padding:14px;}.source{display:flex;align-items:center;gap:5px;font-size:.7rem;color:#5a5a70;margin-bottom:5px;}.dot{width:15px;height:15px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:.55rem;font-weight:800;}.ptitle{font-family:'Clash Display',sans-serif;font-size:.95rem;line-height:1.3;margin-bottom:3px;}.pdesc{font-size:.77rem;color:#9090a8;line-height:1.5;}.lbl{padding:6px 16px 8px;font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5a5a70;}.btns{padding:0 14px;display:flex;flex-direction:column;gap:9px;}.pbtn{display:flex;align-items:center;gap:11px;padding:13px 14px;border-radius:13px;border:none;cursor:pointer;font-family:'Cabinet Grotesk',sans-serif;font-size:.88rem;font-weight:600;width:100%;text-align:left;transition:transform .2s;}.pbtn:hover{transform:translateX(4px);}.pbtn:active{transform:scale(.98);}.ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;flex-shrink:0;color:#fff;}.txt{flex:1;}.lbl2{display:block;font-weight:700;font-size:.84rem;}.sub{display:block;font-size:.67rem;opacity:.5;margin-top:1px;}.arr{opacity:.3;font-size:.85rem;}.acts{display:flex;gap:9px;padding:14px;}.act{flex:1;padding:10px;border-radius:10px;border:1.5px solid #2a2a35;background:transparent;color:#9090a8;font-family:'Cabinet Grotesk',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .15s;}.act:hover{background:#1c1c22;color:#f0f0f5;}.rep{display:block;text-align:center;font-size:.7rem;color:#5a5a70;padding:8px;cursor:pointer;}.pw{text-align:center;font-size:.67rem;color:#5a5a70;padding:13px;border-top:1px solid #2a2a35;}.fb{display:none;margin:0 14px;background:rgba(255,209,102,.07);border:1px solid rgba(255,209,102,.18);border-radius:10px;padding:11px 13px;font-size:.77rem;color:#ffd166;gap:8px;align-items:flex-start;}`}</style>
      </head>
      <body>
        <div className="wrap">
          <div className="top">
            <span className="dom">mo.link/{params.slug}</span>
            <a href="/" className="back">← MultiOpen</a>
          </div>
          <div className="card">
            <div className="img">🎬</div>
            <div className="body">
              <div className="source"><span className="dot" style={{background:'#1877f2'}}>f</span>Posted on Facebook</div>
              <div className="ptitle">{link.title}</div>
              {link.description && <div className="pdesc">{link.description}</div>}
            </div>
          </div>
          <div id="fbbar" className="fb"><span>ℹ️</span><div>App may not be installed.<br/><button onClick="document.getElementById('fbbar').style.display='none'" style={{marginTop:6,padding:'4px 10px',background:'#ffd166',color:'#0c0c0f',border:'none',borderRadius:6,fontSize:'.72rem',fontWeight:700,cursor:'pointer'}}>Dismiss</button></div></div>
          <div className="lbl">Open this post in…</div>
          <div className="btns">
            {targets.map((t: any) => (
              <button key={t.id} className="pbtn" style={{background: BG[t.platform] ?? 'rgba(255,255,255,.03)', color: t.brandColor}}
                onClick={`handleOpen('${t.platform}','${t.canonicalUrl}','${t.deepLinkUri ?? ''}','${t.id}')`}>
                <div className="ico" style={{background: t.brandColor}}>{t.iconChar}</div>
                <div className="txt"><span className="lbl2">{t.label}</span><span className="sub">{t.subLabel}</span></div>
                <span className="arr">→</span>
              </button>
            ))}
          </div>
          <div className="acts">
            <button className="act" onClick="copyL()">📋 Copy link</button>
            <button className="act" onClick="shareL()">↗ Share</button>
          </div>
          <span className="rep" onClick="alert('Report submitted. Thank you.')">⚑ Report this link</span>
          <div className="pw">Powered by <strong style={{color:'#9090a8'}}>MultiOpen</strong></div>
        </div>
        <script dangerouslySetInnerHTML={{__html:`
          var slug='${params.slug}';
          var targets=${JSON.stringify(targets)};
          function handleOpen(platform,webUrl,deepLink,targetId){
            fetch('/api/links/'+slug+'/click',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targetId:targetId,platform:platform})}).catch(()=>{});
            if(!deepLink||platform==='web'){window.open(webUrl,'_blank','noopener');return;}
            var ua=navigator.userAgent;
            if(/android/i.test(ua)){window.location.href=deepLink;}
            else if(/iphone|ipad|ipod/i.test(ua)){window.location.href=deepLink;setTimeout(function(){document.getElementById('fbbar').style.display='flex';},1800);}
            else{window.open(webUrl,'_blank','noopener');}
          }
          document.querySelectorAll('.pbtn').forEach(function(btn){
            var onclick=btn.getAttribute('onclick');
            if(onclick){btn.removeAttribute('onclick');btn.addEventListener('click',function(){eval(onclick);});}
          });
          function copyL(){navigator.clipboard.writeText('${BASE}/l/${params.slug}').catch(()=>{});alert('Copied!');}
          function shareL(){if(navigator.share){navigator.share({title:'${link.title}',url:'${BASE}/l/${params.slug}'}).catch(()=>{});}else{copyL();}}
        `}}/>
      </body>
    </html>
  )
}
