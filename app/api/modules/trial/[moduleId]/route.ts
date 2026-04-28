import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No auth' }, { status: 401 })
  const { moduleId } = await params

  // Check if trial already exists
  const { data: existing } = await supabase
    .from('trials')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (existing) {
    const hoursLeft = Math.max(0, Math.floor((new Date(existing.expires_at).getTime() - Date.now()) / 3600000))
    return NextResponse.json({
      already_activated: true,
      expires_at: existing.expires_at,
      hours_left: hoursLeft,
      is_active: new Date(existing.expires_at) > new Date()
    })
  }

  const trialHours = parseInt(process.env.TRIAL_HOURS || '72')
  const expiresAt = new Date(Date.now() + trialHours * 3600000).toISOString()

  const { data, error } = await supabase
    .from('trials')
    .insert({ user_id: userId, module_id: moduleId, expires_at: expiresAt })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('access_log').insert({ user_id: userId, module_id: moduleId, action: 'trial_activated' })

  return NextResponse.json({
    trial_id: data.id,
    module_id: moduleId,
    expires_at: expiresAt,
    hours_left: trialHours
  })
}
