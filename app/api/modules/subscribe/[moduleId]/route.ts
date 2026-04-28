import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No auth' }, { status: 401 })
  const { moduleId } = await params
  const { payment_ref } = await req.json()

  // Check if already subscribed to this module
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Ya tienes suscripción activa para este módulo' }, { status: 400 })

  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      module_id: moduleId,
      price_usd: parseFloat(process.env.MODULE_PRICE_USD || '3.00'),
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_ref: payment_ref || 'SIMULATED',
    }, { onConflict: 'user_id,module_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('access_log').insert({ user_id: userId, module_id: moduleId, action: 'subscribed' })

  return NextResponse.json({ subscription_id: data.id, module_id: moduleId, expires_at: expiresAt.toISOString() })
}
