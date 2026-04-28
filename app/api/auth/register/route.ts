import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, name, specialty } = await req.json()
  if (!email || !password || !name) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })

  const exists = await db.get('SELECT id FROM users WHERE email = ?', [email])
  if (exists) return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })

  const id = uuid()
  const hash = bcrypt.hashSync(password, 10)
  await db.run('INSERT INTO users (id,email,password,name,specialty) VALUES (?,?,?,?,?)', [id, email, hash, name, specialty || ''])

  const token = signToken({ id, email, name })
  const res = NextResponse.json({ user: { id, email, name, specialty } })
  res.cookies.set('medicore_token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/' })
  return res
}
