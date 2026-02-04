import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shelters, animals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createDonationPreference } from '@/lib/payments/mercadopago'

const createPreferenceSchema = z.object({
  shelterId: z.string().min(1, 'El refugio es requerido'),
  animalId: z.string().optional(),
  amount: z.number().positive('El monto debe ser positivo'),
  currency: z.string().default('ARS'),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
})

// POST /api/payments/mercadopago/create - Create a payment preference
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createPreferenceSchema.parse(body)

    // Get shelter info
    const [shelter] = await db
      .select()
      .from(shelters)
      .where(eq(shelters.id, validated.shelterId))
      .limit(1)

    if (!shelter) {
      return NextResponse.json(
        { error: 'Refugio no encontrado' },
        { status: 404 }
      )
    }

    // Get animal info if provided
    let animal = null
    if (validated.animalId) {
      const [animalResult] = await db
        .select()
        .from(animals)
        .where(eq(animals.id, validated.animalId))
        .limit(1)
      animal = animalResult
    }

    // Build the URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const title = animal
      ? `Donación para ${animal.name} - ${shelter.name}`
      : `Donación para ${shelter.name}`

    const description = animal
      ? `Donación para ayudar a ${animal.name} en ${shelter.name}`
      : `Donación para apoyar a los animales de ${shelter.name}`

    const preference = await createDonationPreference({
      title,
      description,
      amount: validated.amount,
      currency: validated.currency,
      shelterName: shelter.name,
      shelterId: shelter.id,
      animalId: animal?.id,
      animalName: animal?.name,
      donorName: validated.donorName,
      donorEmail: validated.donorEmail,
      backUrls: {
        success: `${baseUrl}/donate/success`,
        failure: `${baseUrl}/donate/failure`,
        pending: `${baseUrl}/donate/pending`,
      },
      notificationUrl: `${baseUrl}/api/payments/mercadopago/webhook`,
    })

    return NextResponse.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'MercadoPago not configured') {
      return NextResponse.json(
        { error: 'MercadoPago no está configurado' },
        { status: 503 }
      )
    }

    console.error('Error creating preference:', error)
    return NextResponse.json(
      { error: 'Error al crear preferencia de pago' },
      { status: 500 }
    )
  }
}


