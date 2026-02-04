import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelters, userRoles, animals } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const updateShelterSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
})

// GET /api/shelters/[id] - Get single shelter
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

    // Verify user has access to this shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, id)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este refugio' },
        { status: 403 }
      )
    }

    const [shelter] = await db
      .select()
      .from(shelters)
      .where(eq(shelters.id, id))
      .limit(1)

    if (!shelter) {
      return NextResponse.json(
        { error: 'Refugio no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { ...shelter, role: userRole.role } })
  } catch (error) {
    console.error('Error fetching shelter:', error)
    return NextResponse.json(
      { error: 'Error al obtener refugio' },
      { status: 500 }
    )
  }
}

// PATCH /api/shelters/[id] - Update shelter (admin only)
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

    // Verify user is admin of this shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, id),
          eq(userRoles.role, 'admin')
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden editar el refugio' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = updateShelterSchema.parse(body)

    const [updatedShelter] = await db
      .update(shelters)
      .set({
        ...validated,
        email: validated.email || null,
        website: validated.website || null,
        updatedAt: new Date(),
      })
      .where(eq(shelters.id, id))
      .returning()

    return NextResponse.json({ data: updatedShelter })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating shelter:', error)
    return NextResponse.json(
      { error: 'Error al actualizar refugio' },
      { status: 500 }
    )
  }
}

// DELETE /api/shelters/[id] - Delete shelter (admin only, must have no animals)
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

    // Verify user is admin of this shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, id),
          eq(userRoles.role, 'admin')
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar el refugio' },
        { status: 403 }
      )
    }

    // Check if shelter has animals
    const [animalCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(animals)
      .where(eq(animals.shelterId, id))

    if (animalCount.count > 0) {
      return NextResponse.json(
        { error: 'No puedes eliminar un refugio que tiene animales registrados. Elimina o transfiere los animales primero.' },
        { status: 400 }
      )
    }

    // Delete user roles for this shelter first
    await db.delete(userRoles).where(eq(userRoles.shelterId, id))

    // Delete shelter
    await db.delete(shelters).where(eq(shelters.id, id))

    return NextResponse.json({ message: 'Refugio eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting shelter:', error)
    return NextResponse.json(
      { error: 'Error al eliminar refugio' },
      { status: 500 }
    )
  }
}


