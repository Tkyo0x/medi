import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

  const { data } = await supabase.from('access_log').select('*').order('created_at', { ascending: false }).limit(limit)
  const clerk = (await import('@clerk/nextjs/server')).clerkClient
  const cl = await clerk()
  const userCache: Record<string, string> = {}
  const enriched = await Promise.all((data || []).map(async (l: any) => {
    if (!userCache[l.user_id]) { try { const u = await cl.users.getUser(l.user_id); userCache[l.user_id] = u.emailAddresses[0]?.emailAddress || '' } catch { userCache[l.user_id] = '' } }
    return { ...l, user_email: userCache[l.user_id] }
  }))
  return NextResponse.json(enriched)
}
