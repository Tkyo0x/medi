import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (!user || !bcrypt.compareSync(password, user.password))
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  const token = signToken({ id: user.id, email: user.email, name: user.name })
  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, specialty: user.specialty } })
  res.cookies.set('medicore_token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/' })
  return res
}