import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function GET() {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data } = await supabase.from('app_config').select('*')
  const config: Record<string, string> = {}
  ;(data || []).forEach((r: any) => { config[r.key] = r.value })
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const updates = await req.json()
  for (const [key, value] of Object.entries(updates)) {
    await supabase.from('app_config').upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
  }
  return NextResponse.json({ ok: true })
}
