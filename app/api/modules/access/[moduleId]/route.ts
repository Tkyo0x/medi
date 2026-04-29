import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ access: false, reason: 'no_auth' })

    if (isAdmin(userId)) return NextResponse.json({ access: true, reason: 'admin' })

    const { moduleId } = await params
    const now = new Date().toISOString()

    const { data: sub, error: subErr } = await supabase
      .from('subscriptions').select('id')
      .eq('user_id', userId).eq('module_id', moduleId).eq('status', 'active').gt('expires_at', now).maybeSingle()

    if (subErr) throw new Error(subErr.message)

    if (sub) {
      await supabase.from('access_log').insert({ user_id: userId, module_id: moduleId, action: 'access_sub' })
      return NextResponse.json({ access: true, reason: 'subscription' })
    }

    const { data: trial, error: trialErr } = await supabase
      .from('trials').select('*')
      .eq('user_id', userId).eq('module_id', moduleId).maybeSingle()

    if (trialErr) throw new Error(trialErr.message)

    if (trial && new Date(trial.expires_at) > new Date()) {
      await supabase.from('access_log').insert({ user_id: userId, module_id: moduleId, action: 'access_trial' })
      return NextResponse.json({ access: true, reason: 'trial', hours_left: Math.floor((new Date(trial.expires_at).getTime() - Date.now()) / 3600000) })
    }

    if (trial) return NextResponse.json({ access: false, reason: 'trial_expired' })
    return NextResponse.json({ access: false, reason: 'no_access' })
  } catch (e) {
    console.error('ACCESS ERROR:', e)
    return NextResponse.json({ access: false, reason: 'server_error', details: String(e) }, { status: 500 })
  }
}
