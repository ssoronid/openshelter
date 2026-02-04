import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { donations, shelters, animals, userRoles } from '@/lib/db/schema'
import { eq, and, desc, inArray, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

const createDonationSchema = z.object({
  shelterId: z.string().min(1, 'El refugio es requerido'),
  animalId: z.string().optional(),
  amount: z.string().or(z.number()).transform((v) => String(v)),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['mercadopago', 'pix', 'paypal', 'bank_transfer', 'cash', 'other']),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('completed'),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional().or(z.literal('')),
  donorPhone: z.string().optional(),
  message: z.string().optional(),
  paymentId: z.string().optional(),
  transactionId: z.string().optional(),
  date: z.string().optional(),
})

// GET /api/donations - List donations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const shelterId = searchParams.get('shelterId')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
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

    // Build where conditions
    const conditions = [inArray(donations.shelterId, accessibleShelterIds)]

    if (shelterId) {
      if (!accessibleShelterIds.includes(shelterId)) {
        return NextResponse.json(
          { error: 'No tienes acceso a este refugio' },
          { status: 403 }
        )
      }
      conditions.push(eq(donations.shelterId, shelterId))
    }

    if (status) {
      conditions.push(eq(donations.status, status as any))
    }

    if (paymentMethod) {
      conditions.push(eq(donations.paymentMethod, paymentMethod as any))
    }

    if (startDate) {
      conditions.push(gte(donations.date, startDate))
    }

    if (endDate) {
      conditions.push(lte(donations.date, endDate))
    }

    const whereClause = and(...conditions)

    const results = await db
      .select({
        id: donations.id,
        shelterId: donations.shelterId,
        shelterName: shelters.name,
        animalId: donations.animalId,
        animalName: animals.name,
        amount: donations.amount,
        currency: donations.currency,
        paymentMethod: donations.paymentMethod,
        status: donations.status,
        donorName: donations.donorName,
        donorEmail: donations.donorEmail,
        donorPhone: donations.donorPhone,
        message: donations.message,
        paymentId: donations.paymentId,
        transactionId: donations.transactionId,
        date: donations.date,
        createdAt: donations.createdAt,
        updatedAt: donations.updatedAt,
      })
      .from(donations)
      .leftJoin(shelters, eq(donations.shelterId, shelters.id))
      .leftJoin(animals, eq(donations.animalId, animals.id))
      .where(whereClause)
      .orderBy(desc(donations.date))
      .limit(limit)
      .offset(offset)

    const totalCountResult = await db
      .select()
      .from(donations)
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
    console.error('Error fetching donations:', error)
    return NextResponse.json(
      { error: 'Error al obtener donaciones' },
      { status: 500 }
    )
  }
}

// POST /api/donations - Create donation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createDonationSchema.parse(body)

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

    // If animalId provided, verify it belongs to the shelter
    if (validated.animalId) {
      const [animal] = await db
        .select()
        .from(animals)
        .where(
          and(
            eq(animals.id, validated.animalId),
            eq(animals.shelterId, validated.shelterId)
          )
        )
        .limit(1)

      if (!animal) {
        return NextResponse.json(
          { error: 'El animal no pertenece a este refugio' },
          { status: 400 }
        )
      }
    }

    const [newDonation] = await db
      .insert(donations)
      .values({
        ...validated,
        donorEmail: validated.donorEmail || null,
        date: validated.date || new Date().toISOString().split('T')[0],
      })
      .returning()

    return NextResponse.json({ data: newDonation }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating donation:', error)
    return NextResponse.json(
      { error: 'Error al crear donación' },
      { status: 500 }
    )
  }
}


