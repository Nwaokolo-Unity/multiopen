import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'MultiOpen <onboarding@resend.dev>'
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://multiopen.vercel.app'

export async function sendVerificationEmail(email: string, name: string, token: string) {
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Verify your MultiOpen email',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;">
      <div style="background:#6c63ff;width:36px;height:36px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="color:#fff;font-weight:800;font-size:14px;">M</span>
      </div>
      <h2 style="margin-bottom:8px;">Verify your email, ${name}</h2>
      <p style="color:#666;margin-bottom:24px;">Click below to activate your MultiOpen account.</p>
      <a href="${BASE}/verify-email?token=${token}" style="background:#6c63ff;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">Verify email</a>
      <p style="color:#aaa;font-size:12px;margin-top:24px;">Expires in 24 hours.</p>
    </div>`,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Reset your MultiOpen password',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;">
      <h2 style="margin-bottom:8px;">Reset your password</h2>
      <p style="color:#666;margin-bottom:24px;">We received a password reset request for your account.</p>
      <a href="${BASE}/reset-password?token=${token}" style="background:#6c63ff;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">Reset password</a>
      <p style="color:#aaa;font-size:12px;margin-top:24px;">Expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>`,
  })
}
