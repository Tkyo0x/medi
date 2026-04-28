import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })
  
  const { data: user } = await supabase
    .from('users')
    .select('id,email,name,specialty,created_at')
    .eq('id', session.id)
    .maybeSingle()
    
  return NextResponse.json({ user: user || null })
}