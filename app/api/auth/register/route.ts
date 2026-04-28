import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { supabase } from '@/lib/supabase'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, name, specialty } = await req.json()
  if (!email || !password || !name) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })

  // Verificar si existe con Supabase
  const { data: exists } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (exists) return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })

  const id = uuid()
  const hash = bcrypt.hashSync(password, 10)
  
  // Insertar con Supabase
  const { error } = await supabase
    .from('users')
    .insert([{ id, email, password: hash, name, specialty: specialty || '' }])

  if (error) return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 })

  const token = signToken({ id, email, name })
  const res = NextResponse.json({ user: { id, email, name, specialty } })
  res.cookies.set('medicore_token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/' })
  return res
}