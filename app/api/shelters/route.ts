import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelters, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const createShelterSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
})

// GET /api/shelters - List shelters user has access to
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sheltersList = await db
      .select({
        id: shelters.id,
        name: shelters.name,
        description: shelters.description,
        address: shelters.address,
        phone: shelters.phone,
        email: shelters.email,
        website: shelters.website,
        createdAt: shelters.createdAt,
      })
      .from(shelters)
      .innerJoin(userRoles, eq(shelters.id, userRoles.shelterId))
      .where(eq(userRoles.userId, session.user.id))

    return NextResponse.json({ data: sheltersList })
  } catch (error) {
    console.error('Error fetching shelters:', error)
    return NextResponse.json(
      { error: 'Error al obtener refugios' },
      { status: 500 }
    )
  }
}

// POST /api/shelters - Create shelter (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createShelterSchema.parse(body)

    const [newShelter] = await db.insert(shelters).values(validated).returning()

    // Assign creator as admin
    await db.insert(userRoles).values({
      userId: session.user.id,
      shelterId: newShelter.id,
      role: 'admin',
    })

    return NextResponse.json({ data: newShelter }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating shelter:', error)
    return NextResponse.json(
      { error: 'Error al crear refugio' },
      { status: 500 }
    )
  }
}



