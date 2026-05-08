import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { MODULES } from '@/lib/modules'
import { LandingClient } from '@/components/LandingClient'

export default async function Home() {
  const { userId } = await auth()

  let moduleStatus = null
  if (userId) {
    const now = new Date().toISOString()

    const { data: subs } = await supabase
      .from('subscriptions').select('module_id, expires_at')
      .eq('user_id', userId).eq('status', 'active').gt('expires_at', now)

    const { data: trials } = await supabase
      .from('trials').select('module_id, expires_at')
      .eq('user_id', userId)

    const activeTrials = (trials || [])
      .filter(t => new Date(t.expires_at) > new Date())
      .map(t => ({
        module_id: t.module_id,
        expires_at: t.expires_at,
        hours_left: Math.max(0, Math.floor((new Date(t.expires_at).getTime() - Date.now()) / 3600000)),
      }))

    moduleStatus = {
      subscribed_modules: (subs || []).map(s => s.module_id),
      active_trials: activeTrials,
      all_trials: (trials || []).map(t => t.module_id),
    }
  }

  const { data: configData } = await supabase.from('app_config').select('*')
  const config: Record<string, string> = {}
  ;(configData || []).forEach((r: any) => { config[r.key] = r.value })

  return (
    <LandingClient
      isSignedIn={!!userId}
      moduleStatus={moduleStatus}
      modules={MODULES}
      price={config.annual_price || '20'}
      duration={config.annual_duration || '1'}
      durationUnit={config.annual_unit || 'years'}
      monthlyPrice={config.monthly_price || '3'}
      monthlyDuration={config.monthly_duration || '1'}
      monthlyUnit={config.monthly_unit || 'months'}
      annualPrice={config.annual_price || '20'}
      annualDuration={config.annual_duration || '1'}
      annualUnit={config.annual_unit || 'years'}
    />
  )
}