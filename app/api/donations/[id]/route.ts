import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { donations, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateDonationSchema = z.object({
  amount: z.string().or(z.number()).transform((v) => String(v)).optional(),
  currency: z.string().optional(),
  paymentMethod: z.enum(['mercadopago', 'pix', 'paypal', 'bank_transfer', 'cash', 'other']).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional().or(z.literal('')),
  donorPhone: z.string().optional(),
  message: z.string().optional(),
  paymentId: z.string().optional(),
  transactionId: z.string().optional(),
  date: z.string().optional(),
})

// GET /api/donations/[id] - Get single donation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [donation] = await db
      .select()
      .from(donations)
      .where(eq(donations.id, id))
      .limit(1)

    if (!donation) {
      return NextResponse.json({ error: 'Donación no encontrada' }, { status: 404 })
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, donation.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta donación' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: donation })
  } catch (error) {
    console.error('Error fetching donation:', error)
    return NextResponse.json(
      { error: 'Error al obtener donación' },
      { status: 500 }
    )
  }
}

// PATCH /api/donations/[id] - Update donation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateDonationSchema.parse(body)

    // Get donation first to check permissions
    const [donation] = await db
      .select()
      .from(donations)
      .where(eq(donations.id, id))
      .limit(1)

    if (!donation) {
      return NextResponse.json({ error: 'Donación no encontrada' }, { status: 404 })
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, donation.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta donación' },
        { status: 403 }
      )
    }

    const [updatedDonation] = await db
      .update(donations)
      .set({
        ...validated,
        donorEmail: validated.donorEmail || null,
        updatedAt: new Date(),
      })
      .where(eq(donations.id, id))
      .returning()

    return NextResponse.json({ data: updatedDonation })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating donation:', error)
    return NextResponse.json(
      { error: 'Error al actualizar donación' },
      { status: 500 }
    )
  }
}

// DELETE /api/donations/[id] - Delete donation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get donation first to check permissions
    const [donation] = await db
      .select()
      .from(donations)
      .where(eq(donations.id, id))
      .limit(1)

    if (!donation) {
      return NextResponse.json({ error: 'Donación no encontrada' }, { status: 404 })
    }

    // Verify user has access and is admin
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, donation.shelterId)
        )
      )
      .limit(1)

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar donaciones' },
        { status: 403 }
      )
    }

    await db.delete(donations).where(eq(donations.id, id))

    return NextResponse.json({ message: 'Donación eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting donation:', error)
    return NextResponse.json(
      { error: 'Error al eliminar donación' },
      { status: 500 }
    )
  }
}


