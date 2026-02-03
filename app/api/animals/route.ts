import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { animals, animalPhotos } from '@/lib/db/schema'
import { shelters, userRoles } from '@/lib/db/schema'
import { eq, and, or, like, desc } from 'drizzle-orm'
import { z } from 'zod'

const createAnimalSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string().optional(),
  age: z.number().int().positive().optional(),
  status: z.enum(['available', 'adopted', 'deceased', 'in_treatment']).default('available'),
  description: z.string().optional(),
  shelterId: z.string().min(1, 'El refugio es requerido'),
})

const updateAnimalSchema = createAnimalSchema.partial()

// GET /api/animals - List animals with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const shelterId = searchParams.get('shelterId')
    const status = searchParams.get('status')
    const species = searchParams.get('species')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = []

    if (shelterId) {
      conditions.push(eq(animals.shelterId, shelterId))
    }

    if (status) {
      conditions.push(eq(animals.status, status as any))
    }

    if (species) {
      conditions.push(eq(animals.species, species as any))
    }

    if (search) {
      conditions.push(
        or(
          like(animals.name, `%${search}%`),
          like(animals.breed || '', `%${search}%`),
          like(animals.description || '', `%${search}%`)
        )!
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const results = await db
      .select({
        id: animals.id,
        name: animals.name,
        species: animals.species,
        breed: animals.breed,
        age: animals.age,
        status: animals.status,
        description: animals.description,
        shelterId: animals.shelterId,
        shelterName: shelters.name,
        createdAt: animals.createdAt,
        updatedAt: animals.updatedAt,
      })
      .from(animals)
      .leftJoin(shelters, eq(animals.shelterId, shelters.id))
      .where(whereClause)
      .orderBy(desc(animals.createdAt))
      .limit(limit)
      .offset(offset)

    const totalCountResult = await db
      .select({ count: animals.id })
      .from(animals)
      .where(whereClause)

    const totalCount = totalCountResult.length

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching animals:', error)
    return NextResponse.json(
      { error: 'Error al obtener animales' },
      { status: 500 }
    )
  }
}

// POST /api/animals - Create animal
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createAnimalSchema.parse(body)

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, validated.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este refugio' },
        { status: 403 }
      )
    }

    const [newAnimal] = await db
      .insert(animals)
      .values({
        ...validated,
        id: undefined, // Let Drizzle generate the ID
      })
      .returning()

    return NextResponse.json({ data: newAnimal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating animal:', error)
    return NextResponse.json(
      { error: 'Error al crear animal' },
      { status: 500 }
    )
  }
}

