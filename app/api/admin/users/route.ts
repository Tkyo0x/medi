import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const search = req.nextUrl.searchParams.get('search') || ''
  const clerk = await clerkClient()

  try {
    if (search) {
      const users = await clerk.users.getUserList({ emailAddress: [search], limit: 10 })
      return NextResponse.json(users.data.map(u => ({
        id: u.id,
        email: u.emailAddresses[0]?.emailAddress || '',
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.emailAddresses[0]?.emailAddress || 'Sin nombre',
        image: u.imageUrl,
        created: u.createdAt,
      })))
    }

    const users = await clerk.users.getUserList({ limit: 50, orderBy: '-created_at' })
    return NextResponse.json(users.data.map(u => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress || '',
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.emailAddresses[0]?.emailAddress || 'Sin nombre',
      image: u.imageUrl,
      created: u.createdAt,
    })))
  } catch (e) {
    console.error('Clerk users error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
