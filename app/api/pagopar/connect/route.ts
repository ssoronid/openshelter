import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelterPagoparCredentials, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const connectSchema = z.object({
  shelterId: z.string().min(1),
  publicKey: z.string().min(1, 'La clave pública es requerida'),
  privateKey: z.string().min(1, 'La clave privada es requerida'),
  commerceName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = connectSchema.parse(body)

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
        { error: 'Solo los administradores pueden conectar Pagopar' },
        { status: 403 }
      )
    }

    // Build webhook URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl}/api/payments/pagopar/webhook`

    // Upsert credentials
    await db
      .insert(shelterPagoparCredentials)
      .values({
        shelterId: validated.shelterId,
        publicKey: validated.publicKey,
        privateKey: validated.privateKey,
        commerceName: validated.commerceName || null,
        webhookUrl,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: shelterPagoparCredentials.shelterId,
        set: {
          publicKey: validated.publicKey,
          privateKey: validated.privateKey,
          commerceName: validated.commerceName || null,
          webhookUrl,
          isActive: true,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json({
      success: true,
      message: 'Pagopar conectado exitosamente',
      webhookUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error connecting Pagopar:', error)
    return NextResponse.json({ error: 'Error al conectar Pagopar' }, { status: 500 })
  }
}

