import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ ok: true, time: new Date().toISOString() })
}
