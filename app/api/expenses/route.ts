import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses, shelters, animals, userRoles } from '@/lib/db/schema'
import { eq, and, desc, inArray, gte, lte, like } from 'drizzle-orm'
import { z } from 'zod'

const createExpenseSchema = z.object({
  shelterId: z.string().min(1, 'El refugio es requerido'),
  animalId: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.string().or(z.number()).transform((v) => String(v)),
  currency: z.string().default('USD'),
  date: z.string().min(1, 'La fecha es requerida'),
  receipt: z.string().optional(),
})

// GET /api/expenses - List expenses with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const shelterId = searchParams.get('shelterId')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
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
    const conditions = [inArray(expenses.shelterId, accessibleShelterIds)]

    if (shelterId) {
      if (!accessibleShelterIds.includes(shelterId)) {
        return NextResponse.json(
          { error: 'No tienes acceso a este refugio' },
          { status: 403 }
        )
      }
      conditions.push(eq(expenses.shelterId, shelterId))
    }

    if (category) {
      conditions.push(eq(expenses.category, category))
    }

    if (startDate) {
      conditions.push(gte(expenses.date, startDate))
    }

    if (endDate) {
      conditions.push(lte(expenses.date, endDate))
    }

    if (search) {
      conditions.push(like(expenses.description, `%${search}%`))
    }

    const whereClause = and(...conditions)

    const results = await db
      .select({
        id: expenses.id,
        shelterId: expenses.shelterId,
        shelterName: shelters.name,
        animalId: expenses.animalId,
        animalName: animals.name,
        category: expenses.category,
        description: expenses.description,
        amount: expenses.amount,
        currency: expenses.currency,
        date: expenses.date,
        receipt: expenses.receipt,
        createdBy: expenses.createdBy,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(shelters, eq(expenses.shelterId, shelters.id))
      .leftJoin(animals, eq(expenses.animalId, animals.id))
      .where(whereClause)
      .orderBy(desc(expenses.date))
      .limit(limit)
      .offset(offset)

    const totalCountResult = await db
      .select()
      .from(expenses)
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
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Error al obtener gastos' },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create expense
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createExpenseSchema.parse(body)

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

    const [newExpense] = await db
      .insert(expenses)
      .values({
        ...validated,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json({ data: newExpense }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Error al crear gasto' },
      { status: 500 }
    )
  }
}



