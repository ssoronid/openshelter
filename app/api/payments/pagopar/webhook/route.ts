import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { donations, shelterPagoparCredentials } from '@/lib/db/schema'
import { validatePagoparWebhookToken, type PagoparWebhookPayload } from '@/lib/payments/pagopar'
import { eq } from 'drizzle-orm'

/**
 * Find shelter by payment hash
 */
async function findShelterByPaymentHash(hashPedido: string) {
  // Find the donation with this payment ID (hash)
  const [donation] = await db
    .select()
    .from(donations)
    .where(eq(donations.paymentId, hashPedido))
    .limit(1)

  if (donation) {
    // Get shelter's Pagopar credentials
    const [credentials] = await db
      .select()
      .from(shelterPagoparCredentials)
      .where(eq(shelterPagoparCredentials.shelterId, donation.shelterId))
      .limit(1)

    return { donation, credentials }
  }

  return null
}

// POST /api/payments/pagopar/webhook - Handle Pagopar payment notifications (Paso #3)
export async function POST(request: NextRequest) {
  try {
    const body: PagoparWebhookPayload = await request.json()

    if (!body.respuesta || !body.resultado?.[0]) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const paymentData = body.resultado[0]
    const { hash_pedido, token, pagado, cancelado, monto, forma_pago } = paymentData

    // Find the shelter and donation for this payment
    const result = await findShelterByPaymentHash(hash_pedido)

    if (!result) {
      console.warn('No donation found for Pagopar hash:', hash_pedido)
      // Return the payload as required by Pagopar (even if we don't process it)
      return NextResponse.json(body.resultado)
    }

    const { donation, credentials } = result

    if (!credentials) {
      console.error('No Pagopar credentials found for shelter:', donation.shelterId)
      return NextResponse.json(body.resultado)
    }

    // Validate token - CRITICAL for security
    const isValidToken = validatePagoparWebhookToken(credentials.privateKey, hash_pedido, token)

    if (!isValidToken) {
      console.error('Invalid Pagopar webhook token for hash:', hash_pedido)
      return NextResponse.json({ error: 'Token no coincide' }, { status: 401 })
    }

    // Determine donation status
    let donationStatus: 'pending' | 'completed' | 'failed' | 'refunded' = 'pending'

    if (pagado) {
      donationStatus = 'completed'
    } else if (cancelado) {
      donationStatus = 'failed'
    }

    // Update donation record
    await db
      .update(donations)
      .set({
        status: donationStatus,
        amount: parseFloat(monto).toFixed(2),
        updatedAt: new Date(),
        // Store additional info in notes or metadata if needed
      })
      .where(eq(donations.paymentId, hash_pedido))

    console.log(
      `Pagopar webhook processed: hash=${hash_pedido}, status=${donationStatus}, method=${forma_pago}`
    )

    // Return the result as required by Pagopar
    return NextResponse.json(body.resultado)
  } catch (error) {
    console.error('Error processing Pagopar webhook:', error)
    // Return 200 to prevent Pagopar from retrying
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

// GET for health check
export async function GET() {
  return NextResponse.json({ status: 'ok', provider: 'pagopar' })
}

