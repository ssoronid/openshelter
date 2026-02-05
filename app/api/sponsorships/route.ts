import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sponsorships, animals, userRoles } from '@/lib/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { z } from 'zod'

const createSponsorshipSchema = z.object({
  animalId: z.string().min(1, 'El animal es requerido'),
  sponsorName: z.string().min(1, 'El nombre del padrino es requerido'),
  sponsorEmail: z.string().email('Email inválido'),
  amount: z.string().or(z.number()).transform((v) => String(v)),
  frequency: z.enum(['monthly', 'yearly']).default('monthly'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().optional(),
  isActive: z.string().default('true'),
  paymentMethod: z.enum(['mercadopago', 'pix', 'paypal', 'bank_transfer', 'cash', 'other']),
})

// GET /api/sponsorships - List sponsorships
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const animalId = searchParams.get('animalId')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get user's accessible shelters
    const userShelters = await db
      .select({ shelterId: userRoles.shelterId })
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id))

    const accessibleShelterIds = userShelters.map((s) => s.shelterId)

    if (accessibleShelterIds.length === 0) {
      return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } })
    }

    // Build where conditions - filter by animals that belong to user's shelters
    const conditions = [inArray(animals.shelterId, accessibleShelterIds)]

    if (animalId) {
      conditions.push(eq(sponsorships.animalId, animalId))
    }

    if (isActive) {
      conditions.push(eq(sponsorships.isActive, isActive))
    }

    const whereClause = and(...conditions)

    const results = await db
      .select({
        id: sponsorships.id,
        animalId: sponsorships.animalId,
        animalName: animals.name,
        animalSpecies: animals.species,
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
      .where(whereClause)
      .orderBy(desc(sponsorships.createdAt))
      .limit(limit)
      .offset(offset)

    const totalCountResult = await db
      .select()
      .from(sponsorships)
      .innerJoin(animals, eq(sponsorships.animalId, animals.id))
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
    console.error('Error fetching sponsorships:', error)
    return NextResponse.json(
      { error: 'Error al obtener apadrinamientos' },
      { status: 500 }
    )
  }
}

// POST /api/sponsorships - Create sponsorship
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createSponsorshipSchema.parse(body)

    // Get the animal to verify shelter access
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, validated.animalId))
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
        { error: 'No tienes acceso a este refugio' },
        { status: 403 }
      )
    }

    const [newSponsorship] = await db
      .insert(sponsorships)
      .values({
        ...validated,
        endDate: validated.endDate || null,
      })
      .returning()

    return NextResponse.json({ data: newSponsorship }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating sponsorship:', error)
    return NextResponse.json(
      { error: 'Error al crear apadrinamiento' },
      { status: 500 }
    )
  }
}



