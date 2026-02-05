import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shelters, animals, donations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createPagoparTransaction, getPagoparCheckoutUrl } from '@/lib/payments/pagopar'
import { createId } from '@paralleldrive/cuid2'

const createTransactionSchema = z.object({
  shelterId: z.string().min(1, 'El refugio es requerido'),
  animalId: z.string().optional(),
  amount: z.number().positive('El monto debe ser positivo'),
  currency: z.string().default('PYG'),
  donorName: z.string().min(1, 'El nombre es requerido'),
  donorEmail: z.string().email('Email inválido'),
  donorPhone: z.string().min(1, 'El teléfono es requerido'),
  donorDocument: z.string().min(1, 'El documento es requerido'),
  paymentMethod: z.number().optional(), // forma_pago ID
})

// POST /api/payments/pagopar/create - Create a Pagopar transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createTransactionSchema.parse(body)

    // Get shelter info
    const [shelter] = await db
      .select()
      .from(shelters)
      .where(eq(shelters.id, validated.shelterId))
      .limit(1)

    if (!shelter) {
      return NextResponse.json({ error: 'Refugio no encontrado' }, { status: 404 })
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

    // Generate unique order ID
    const orderId = createId()

    const description = animal
      ? `Donación para ${animal.name} - ${shelter.name}`
      : `Donación para ${shelter.name}`

    // Create transaction in Pagopar
    const result = await createPagoparTransaction({
      shelterId: validated.shelterId,
      orderId,
      amount: validated.amount,
      description,
      buyer: {
        nombre: validated.donorName,
        email: validated.donorEmail,
        telefono: validated.donorPhone,
        documento: validated.donorDocument,
      },
      paymentMethod: validated.paymentMethod,
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Error al crear transacción en Pagopar' },
        { status: 500 }
      )
    }

    // Create pending donation record
    await db.insert(donations).values({
      shelterId: validated.shelterId,
      animalId: validated.animalId || null,
      amount: validated.amount.toFixed(2),
      currency: validated.currency,
      paymentMethod: 'pagopar',
      status: 'pending',
      donorName: validated.donorName,
      donorEmail: validated.donorEmail,
      paymentId: result.hash, // Using hash as payment ID
      transactionId: result.orderId,
      date: new Date().toISOString().split('T')[0],
    })

    // Return checkout URL
    const checkoutUrl = getPagoparCheckoutUrl(result.hash, validated.paymentMethod)

    return NextResponse.json({
      hash: result.hash,
      orderId: result.orderId,
      checkoutUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('Pagopar not configured')) {
      return NextResponse.json(
        { error: 'Pagopar no está configurado para este refugio' },
        { status: 503 }
      )
    }

    console.error('Error creating Pagopar transaction:', error)
    return NextResponse.json(
      { error: 'Error al crear transacción de pago' },
      { status: 500 }
    )
  }
}

