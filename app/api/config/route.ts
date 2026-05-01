import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase.from('app_config').select('*')
  const config: Record<string, string> = {}
  ;(data || []).forEach((r: any) => { config[r.key] = r.value })
  return NextResponse.json(config)
}
