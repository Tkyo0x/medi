import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })
  const user = await db.get('SELECT id,email,name,specialty,created_at FROM users WHERE id = ?', [session.id])
  return NextResponse.json({ user: user || null })
}
