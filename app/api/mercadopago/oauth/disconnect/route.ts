import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelterMercadopagoCredentials, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// POST /api/mercadopago/oauth/disconnect
// Disconnects MercadoPago from a shelter
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { shelterId } = body

    if (!shelterId) {
      return NextResponse.json({ error: 'shelterId requerido' }, { status: 400 })
    }

    // Verify user is admin of this shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, shelterId),
          eq(userRoles.role, 'admin')
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden desconectar MercadoPago' },
        { status: 403 }
      )
    }

    // Delete the credentials
    await db
      .delete(shelterMercadopagoCredentials)
      .where(eq(shelterMercadopagoCredentials.shelterId, shelterId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting MercadoPago:', error)
    return NextResponse.json(
      { error: 'Error al desconectar MercadoPago' },
      { status: 500 }
    )
  }
}


