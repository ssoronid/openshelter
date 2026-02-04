import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sponsorships, animals, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateSponsorshipSchema = z.object({
  sponsorName: z.string().min(1).optional(),
  sponsorEmail: z.string().email().optional(),
  amount: z.string().or(z.number()).transform((v) => String(v)).optional(),
  frequency: z.enum(['monthly', 'yearly']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isActive: z.string().optional(),
  paymentMethod: z.enum(['mercadopago', 'pix', 'paypal', 'bank_transfer', 'cash', 'other']).optional(),
})

// GET /api/sponsorships/[id] - Get single sponsorship
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

    const [sponsorship] = await db
      .select({
        id: sponsorships.id,
        animalId: sponsorships.animalId,
        animalName: animals.name,
        shelterId: animals.shelterId,
        sponsorName: sponsorships.sponsorName,
        sponsorEmail: sponsorships.sponsorEmail,
        amount: sponsorships.amount,
        frequency: sponsorships.frequency,
        startDate: sponsorships.startDate,
        endDate: sponsorships.endDate,
        isActive: sponsorships.isActive,
        paymentMethod: sponsorships.paymentMethod,
        createdAt: sponsorships.createdAt,
        updatedAt: sponsorships.updatedAt,
      })
      .from(sponsorships)
      .innerJoin(animals, eq(sponsorships.animalId, animals.id))
      .where(eq(sponsorships.id, id))
      .limit(1)

    if (!sponsorship) {
      return NextResponse.json({ error: 'Apadrinamiento no encontrado' }, { status: 404 })
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, sponsorship.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este apadrinamiento' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: sponsorship })
  } catch (error) {
    console.error('Error fetching sponsorship:', error)
    return NextResponse.json(
      { error: 'Error al obtener apadrinamiento' },
      { status: 500 }
    )
  }
}

// PATCH /api/sponsorships/[id] - Update sponsorship
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
    const validated = updateSponsorshipSchema.parse(body)

    // Get sponsorship with animal to check shelter access
    const [sponsorship] = await db
      .select({
        id: sponsorships.id,
        shelterId: animals.shelterId,
      })
      .from(sponsorships)
      .innerJoin(animals, eq(sponsorships.animalId, animals.id))
      .where(eq(sponsorships.id, id))
      .limit(1)

    if (!sponsorship) {
      return NextResponse.json({ error: 'Apadrinamiento no encontrado' }, { status: 404 })
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, sponsorship.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este apadrinamiento' },
        { status: 403 }
      )
    }

    const [updatedSponsorship] = await db
      .update(sponsorships)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(sponsorships.id, id))
      .returning()

    return NextResponse.json({ data: updatedSponsorship })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating sponsorship:', error)
    return NextResponse.json(
      { error: 'Error al actualizar apadrinamiento' },
      { status: 500 }
    )
  }
}

// DELETE /api/sponsorships/[id] - Delete sponsorship
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

    // Get sponsorship with animal to check shelter access
    const [sponsorship] = await db
      .select({
        id: sponsorships.id,
        shelterId: animals.shelterId,
      })
      .from(sponsorships)
      .innerJoin(animals, eq(sponsorships.animalId, animals.id))
      .where(eq(sponsorships.id, id))
      .limit(1)

    if (!sponsorship) {
      return NextResponse.json({ error: 'Apadrinamiento no encontrado' }, { status: 404 })
    }

    // Verify user has access and is admin
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, sponsorship.shelterId)
        )
      )
      .limit(1)

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar apadrinamientos' },
        { status: 403 }
      )
    }

    await db.delete(sponsorships).where(eq(sponsorships.id, id))

    return NextResponse.json({ message: 'Apadrinamiento eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting sponsorship:', error)
    return NextResponse.json(
      { error: 'Error al eliminar apadrinamiento' },
      { status: 500 }
    )
  }
}


