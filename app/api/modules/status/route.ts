import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const now = new Date().toISOString()

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', now)

  const { data: trials } = await supabase
    .from('trials')
    .select('*')
    .eq('user_id', userId)

  const activeTrials = (trials || [])
    .filter(t => new Date(t.expires_at) > new Date())
    .map(t => ({
      module_id: t.module_id,
      expires_at: t.expires_at,
      hours_left: Math.max(0, Math.floor((new Date(t.expires_at).getTime() - Date.now()) / 3600000)),
    }))

  const subscribedModules = (subs || []).map(s => s.module_id)

  return NextResponse.json({
    subscribed_modules: subscribedModules,
    active_trials: activeTrials,
    all_trials: (trials || []).map(t => t.module_id),
  })
}
