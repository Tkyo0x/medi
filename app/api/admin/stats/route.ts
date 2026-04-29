import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function GET() {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date().toISOString()

  const { count: totalSubs } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('expires_at', now)
  const { count: totalTrials } = await supabase.from('trials').select('*', { count: 'exact', head: true })
  const { count: activeTrials } = await supabase.from('trials').select('*', { count: 'exact', head: true }).gt('expires_at', now)
  const { count: totalLogs } = await supabase.from('access_log').select('*', { count: 'exact', head: true })

  const { data: recentLogs } = await supabase.from('access_log').select('*').order('created_at', { ascending: false }).limit(20)

  const { data: subsByModule } = await supabase.from('subscriptions').select('module_id').eq('status', 'active').gt('expires_at', now)
  const moduleCounts: Record<string, number> = {}
  ;(subsByModule || []).forEach(s => { moduleCounts[s.module_id] = (moduleCounts[s.module_id] || 0) + 1 })

  return NextResponse.json({
    total_subscriptions: totalSubs || 0,
    total_trials: totalTrials || 0,
    active_trials: activeTrials || 0,
    total_access_logs: totalLogs || 0,
    recent_logs: recentLogs || [],
    subs_by_module: moduleCounts,
  })
}
