import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { animals } from '@/lib/db/schema'
import { userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateAnimalSchema = z.object({
  name: z.string().min(1).optional(),
  species: z.enum(['dog', 'cat', 'other']).optional(),
  breed: z.string().optional(),
  age: z.number().int().positive().optional(),
  status: z.enum(['available', 'adopted', 'deceased', 'in_treatment']).optional(),
  description: z.string().optional(),
})

// GET /api/animals/[id] - Get single animal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, params.id))
      .limit(1)

    if (!animal) {
      return NextResponse.json({ error: 'Animal no encontrado' }, { status: 404 })
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, animal.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este animal' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: animal })
  } catch (error) {
    console.error('Error fetching animal:', error)
    return NextResponse.json(
      { error: 'Error al obtener animal' },
      { status: 500 }
    )
  }
}

// PATCH /api/animals/[id] - Update animal
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateAnimalSchema.parse(body)

    // Get animal first to check permissions
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, params.id))
      .limit(1)

    if (!animal) {
      return NextResponse.json({ error: 'Animal no encontrado' }, { status: 404 })
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, animal.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este animal' },
        { status: 403 }
      )
    }

    const [updatedAnimal] = await db
      .update(animals)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(animals.id, params.id))
      .returning()

    return NextResponse.json({ data: updatedAnimal })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating animal:', error)
    return NextResponse.json(
      { error: 'Error al actualizar animal' },
      { status: 500 }
    )
  }
}

// DELETE /api/animals/[id] - Delete animal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get animal first to check permissions
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, params.id))
      .limit(1)

    if (!animal) {
      return NextResponse.json({ error: 'Animal no encontrado' }, { status: 404 })
    }

    // Verify user has access and is admin
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, animal.shelterId)
        )
      )
      .limit(1)

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar animales' },
        { status: 403 }
      )
    }

    await db.delete(animals).where(eq(animals.id, params.id))

    return NextResponse.json({ message: 'Animal eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting animal:', error)
    return NextResponse.json(
      { error: 'Error al eliminar animal' },
      { status: 500 }
    )
  }
}

