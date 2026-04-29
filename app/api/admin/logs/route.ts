import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

  const { data } = await supabase.from('access_log').select('*').order('created_at', { ascending: false }).limit(limit)
  return NextResponse.json(data || [])
}
