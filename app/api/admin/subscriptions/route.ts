import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function GET() {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
  const clerk = (await import('@clerk/nextjs/server')).clerkClient
  const cl = await clerk()
  const enriched = await Promise.all((data || []).map(async (s: any) => {
    try { const u = await cl.users.getUser(s.user_id); return { ...s, user_email: u.emailAddresses[0]?.emailAddress || '' } } catch { return { ...s, user_email: '' } }
  }))
  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, module_id } = await req.json()
  if (!user_id || !module_id) return NextResponse.json({ error: 'user_id and module_id required' }, { status: 400 })

  const { data: configData } = await supabase.from('app_config').select('*')
  const cfg: Record<string, string> = {}
  ;(configData || []).forEach((r: any) => { cfg[r.key] = r.value })
  const price = parseFloat(cfg.module_price || '3.00')
  const duration = parseInt(cfg.subscription_duration || '12')
  const unit = cfg.subscription_unit || 'months'

  const expires = new Date()
  if (unit === 'months') expires.setMonth(expires.getMonth() + duration)
  else if (unit === 'days') expires.setDate(expires.getDate() + duration)
  else if (unit === 'years') expires.setFullYear(expires.getFullYear() + duration)

  const { data, error } = await supabase.from('subscriptions').upsert({
    user_id, module_id, price_usd: price, status: 'active',
    starts_at: new Date().toISOString(), expires_at: expires.toISOString(),
    payment_ref: 'ADMIN_GRANT'
  }, { onConflict: 'user_id,module_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  const { error } = await supabase.from('subscriptions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
