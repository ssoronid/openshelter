import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { adoptionApplications, animals } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

const createApplicationSchema = z.object({
  animalId: z.string().min(1, 'El animal es requerido'),
  applicantName: z.string().min(1, 'El nombre es requerido'),
  applicantEmail: z.string().email('Email inválido'),
  applicantPhone: z.string().min(1, 'El teléfono es requerido'),
  applicantAddress: z.string().optional(),
  applicantCity: z.string().optional(),
  applicantCountry: z.string().optional(),
  reason: z.string().optional(),
})

// GET /api/adoptions - List adoption applications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const animalId = searchParams.get('animalId')

    const conditions = []
    if (status) {
      conditions.push(eq(adoptionApplications.status, status as any))
    }
    if (animalId) {
      conditions.push(eq(adoptionApplications.animalId, animalId))
    }

    const applications = await db
      .select({
        id: adoptionApplications.id,
        animalId: adoptionApplications.animalId,
        animalName: animals.name,
        applicantName: adoptionApplications.applicantName,
        applicantEmail: adoptionApplications.applicantEmail,
        applicantPhone: adoptionApplications.applicantPhone,
        status: adoptionApplications.status,
        createdAt: adoptionApplications.createdAt,
      })
      .from(adoptionApplications)
      .leftJoin(animals, eq(adoptionApplications.animalId, animals.id))
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(adoptionApplications.createdAt))

    return NextResponse.json({ data: applications })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    )
  }
}

// POST /api/adoptions - Create adoption application (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createApplicationSchema.parse(body)

    // Verify animal exists and is available
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, validated.animalId))
      .limit(1)

    if (!animal) {
      return NextResponse.json(
        { error: 'Animal no encontrado' },
        { status: 404 }
      )
    }

    if (animal.status !== 'available') {
      return NextResponse.json(
        { error: 'Este animal no está disponible para adopción' },
        { status: 400 }
      )
    }

    const [newApplication] = await db
      .insert(adoptionApplications)
      .values(validated)
      .returning()

    return NextResponse.json({ data: newApplication }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Error al crear solicitud' },
      { status: 500 }
    )
  }
}

