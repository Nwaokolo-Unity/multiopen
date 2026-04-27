export default function Home() {
  return (
    <main style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:'Cabinet Grotesk,sans-serif',background:'#0c0c0f',color:'#f0f0f5'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
        <div style={{width:40,height:40,background:'#6c63ff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:'#fff'}}>M↗</div>
        <span style={{fontFamily:'Clash Display,sans-serif',fontWeight:700,fontSize:22}}>MultiOpen</span>
      </div>
      <h1 style={{fontFamily:'Clash Display,sans-serif',fontSize:'clamp(2.2rem,5vw,3.5rem)',fontWeight:700,textAlign:'center',lineHeight:1.1,marginBottom:16}}>
        Share once.<br/><span style={{background:'linear-gradient(135deg,#6c63ff,#ff6584)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Open anywhere.</span>
      </h1>
      <p style={{color:'#9090a8',maxWidth:440,textAlign:'center',lineHeight:1.7,marginBottom:36,fontSize:'1.05rem'}}>
        One short link for any social post. Recipients tap to open in their preferred app — Facebook, X, Instagram, TikTok.
      </p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
        <a href="/signup" style={{padding:'13px 28px',background:'#6c63ff',color:'#fff',borderRadius:12,fontWeight:700,textDecoration:'none',fontSize:'0.95rem'}}>Get started free →</a>
        <a href="/l/bridgeai" style={{padding:'13px 28px',background:'transparent',color:'#9090a8',borderRadius:12,fontWeight:600,textDecoration:'none',fontSize:'0.95rem',border:'1.5px solid #2a2a35'}}>See example link</a>
      </div>
      <div style={{marginTop:60,display:'flex',gap:32,color:'#5a5a70',fontSize:'0.82rem',flexWrap:'wrap',justifyContent:'center'}}>
        {['One link, all platforms','No auto-redirects, ever','Real-time analytics','Built-in publisher'].map(f=>(
          <span key={f} style={{display:'flex',alignItems:'center',gap:6}}><span style={{color:'#43e97b'}}>✓</span>{f}</span>
        ))}
      </div>
    </main>
  )
}
