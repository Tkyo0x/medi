import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import type { User } from '@/types'

const SECRET = process.env.JWT_SECRET || 'fallback_secret'

export function signToken(user: Pick<User, 'id' | 'email' | 'name'>): string {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): { id: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, SECRET) as any
  } catch {
    return null
  }
}

export async function getSession(): Promise<{ id: string; email: string; name: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('medicore_token')?.value
  if (!token) return null
  return verifyToken(token)
}
