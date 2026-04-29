import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  return NextResponse.json({
    error: 'El sistema de pagos automáticos no está disponible aún. Contacta al administrador para activar tu suscripción.',
    contact: 'jhrodriguez6832@gmail.com'
  }, { status: 403 })
}
