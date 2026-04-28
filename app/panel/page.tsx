import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MODULES } from '@/lib/modules'
import { PanelClient } from '@/components/PanelClient'

export default async function PanelPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
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

  return (
    <PanelClient
      userName={user?.firstName || user?.emailAddresses[0]?.emailAddress || 'Usuario'}
      userImage={user?.imageUrl || ''}
      modules={MODULES}
      subscribedModules={(subs || []).map(s => s.module_id)}
      activeTrials={activeTrials}
      allTrials={(trials || []).map(t => t.module_id)}
    />
  )
}
