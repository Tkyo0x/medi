import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  try {
    const clerk = await clerkClient()
    const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 })

    if (users.data.length === 0) {
      return NextResponse.json({ modules: [], name: '', photo: '' })
    }

    const user = users.data[0]
    const userId = user.id
    const now = new Date().toISOString()

    const { data: subs } = await supabase
      .from('subscriptions').select('module_id, expires_at')
      .eq('user_id', userId).eq('status', 'active').gt('expires_at', now)

    const { data: trials } = await supabase
      .from('trials').select('module_id, expires_at')
      .eq('user_id', userId).gt('expires_at', now)

    const modules: { module_id: string; type: string; expires_at: string }[] = []

    ;(subs || []).forEach(s => {
      modules.push({ module_id: s.module_id, type: 'subscription', expires_at: s.expires_at })
    })

    ;(trials || []).forEach(t => {
      if (!modules.find(m => m.module_id === t.module_id)) {
        modules.push({ module_id: t.module_id, type: 'trial', expires_at: t.expires_at })
      }
    })

    return NextResponse.json({
      modules,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || email.split('@')[0],
      photo: user.imageUrl || '',
    })
  } catch (e: any) {
    // Le quitamos el silenciador al error para verlo en pantalla
    return NextResponse.json({ 
      modules: [], 
      name: 'ERROR_DETECTADO', 
      photo: '',
      debug_error: e?.message || "Error desconocido",
      full_error: JSON.stringify(e)
    })
  }
}