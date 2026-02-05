import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelterPagoparCredentials, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const disconnectSchema = z.object({
  shelterId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = disconnectSchema.parse(body)

    // Verify user is admin of this shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, validated.shelterId),
          eq(userRoles.role, 'admin')
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden desconectar Pagopar' },
        { status: 403 }
      )
    }

    // Delete credentials
    await db
      .delete(shelterPagoparCredentials)
      .where(eq(shelterPagoparCredentials.shelterId, validated.shelterId))

    return NextResponse.json({
      success: true,
      message: 'Pagopar desconectado exitosamente',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error disconnecting Pagopar:', error)
    return NextResponse.json({ error: 'Error al desconectar Pagopar' }, { status: 500 })
  }
}

