export type Platform = 'facebook' | 'x' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'web'

export const PLATFORM_META: Record<Platform, {
  label: string; subLabel: string; brandColor: string; bgColor: string; iconChar: string; appName: string
}> = {
  facebook:  { label: 'Open in Facebook',  subLabel: 'Opens in the Facebook app',  brandColor: '#1877F2', bgColor: 'rgba(24,119,242,.1)',  iconChar: 'f',  appName: 'Facebook'  },
  x:         { label: 'Open in X',         subLabel: 'Opens in the X app',         brandColor: '#ffffff', bgColor: 'rgba(255,255,255,.05)', iconChar: '𝕏', appName: 'X'         },
  instagram: { label: 'Open in Instagram', subLabel: 'Opens in the Instagram app', brandColor: '#E1306C', bgColor: 'rgba(225,48,108,.1)',  iconChar: '◎', appName: 'Instagram' },
  tiktok:    { label: 'Open in TikTok',    subLabel: 'Opens in the TikTok app',    brandColor: '#ffffff', bgColor: 'rgba(255,255,255,.03)', iconChar: '♪', appName: 'TikTok'    },
  youtube:   { label: 'Open in YouTube',   subLabel: 'Opens in the YouTube app',   brandColor: '#FF0000', bgColor: 'rgba(255,0,0,.08)',     iconChar: '▶', appName: 'YouTube'   },
  linkedin:  { label: 'Open in LinkedIn',  subLabel: 'Opens in the LinkedIn app',  brandColor: '#0077B5', bgColor: 'rgba(0,119,181,.1)',    iconChar: 'in', appName: 'LinkedIn' },
  web:       { label: 'Open in Browser',   subLabel: 'Always works · no app needed', brandColor: '#888888', bgColor: 'rgba(255,255,255,.02)', iconChar: '🌐', appName: 'Browser' },
}

export function buildDeepLink(platform: Platform, canonicalUrl: string, os: 'android' | 'ios' | 'other'): string | null {
  try {
    const u = new URL(canonicalUrl)
    if (platform === 'web') return null
    if (platform === 'x' || canonicalUrl.includes('twitter.com') || canonicalUrl.includes('x.com')) {
      const m = canonicalUrl.match(/status\/(\d+)/)
      if (!m) return null
      if (os === 'android') return `intent://twitter.com/i/web/status/${m[1]}#Intent;package=com.twitter.android;scheme=https;end`
      if (os === 'ios') return `twitter://status?id=${m[1]}`
    }
    if (platform === 'facebook') {
      if (os === 'android') return `intent://${u.hostname}${u.pathname}#Intent;package=com.facebook.katana;scheme=https;end`
      if (os === 'ios') return `fb://facewebmodal/f?href=${encodeURIComponent(canonicalUrl)}`
    }
    if (platform === 'instagram') {
      const m = canonicalUrl.match(/\/(p|reel)\/([\w-]+)/)
      if (!m) return null
      if (os === 'android') return `intent://instagram.com/p/${m[2]}/#Intent;package=com.instagram.android;scheme=https;end`
      if (os === 'ios') return `instagram://media?id=${m[2]}`
    }
    if (platform === 'tiktok') {
      const m = canonicalUrl.match(/video\/(\d+)/)
      if (!m) return null
      if (os === 'android') return `intent://vm.tiktok.com/${m[1]}#Intent;package=com.zhiliaoapp.musically;scheme=https;end`
      if (os === 'ios') return `snssdk1128://aweme/detail/?id=${m[1]}`
    }
    if (platform === 'youtube') {
      const m = canonicalUrl.match(/[?&]v=([\w-]+)/) ?? canonicalUrl.match(/youtu\.be\/([\w-]+)/)
      if (!m) return null
      if (os === 'android') return `intent://youtube.com/watch?v=${m[1]}#Intent;package=com.google.android.youtube;scheme=https;end`
      if (os === 'ios') return `youtube://watch?v=${m[1]}`
    }
  } catch {}
  return null
}

export function detectOS(ua: string): 'android' | 'ios' | 'other' {
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'other'
}

export function detectPlatform(url: string): Platform | null {
  if (url.includes('facebook.com')) return 'facebook'
  if (url.includes('x.com') || url.includes('twitter.com')) return 'x'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('linkedin.com')) return 'linkedin'
  return null
}
