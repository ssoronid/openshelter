import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { donations, shelterMercadopagoCredentials } from '@/lib/db/schema'
import { getPaymentDetails, getShelterPaymentClient, globalPaymentClient } from '@/lib/payments/mercadopago'
import { eq } from 'drizzle-orm'

/**
 * Try to get payment details using different credentials
 * First try shelter-specific, then global fallback
 */
async function getPaymentWithFallback(paymentId: string, shelterId?: string) {
  // If we have a shelterId, try shelter-specific credentials first
  if (shelterId) {
    try {
      const payment = await getPaymentDetails(paymentId, shelterId)
      if (payment) return { payment, usedShelterId: shelterId }
    } catch (error) {
      console.warn(`Could not fetch payment with shelter ${shelterId} credentials:`, error)
    }
  }

  // Try global credentials as fallback
  if (globalPaymentClient) {
    try {
      const payment = await globalPaymentClient.get({ id: paymentId })
      if (payment) return { payment, usedShelterId: null }
    } catch (error) {
      console.warn('Could not fetch payment with global credentials:', error)
    }
  }

  // If we don't have shelterId, try all shelter credentials
  if (!shelterId) {
    const allCredentials = await db.select().from(shelterMercadopagoCredentials)
    for (const cred of allCredentials) {
      try {
        const payment = await getPaymentDetails(paymentId, cred.shelterId)
        if (payment) return { payment, usedShelterId: cred.shelterId }
      } catch {
        // Continue to next
      }
    }
  }

  return null
}

// POST /api/payments/mercadopago/webhook - Handle MercadoPago IPN notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // MercadoPago sends different types of notifications
    // We're interested in payment notifications
    if (body.type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    // First, check if we can get shelter info from metadata in the webhook
    // This helps us use the correct credentials
    let initialShelterId: string | undefined

    // Try to get payment with fallback mechanism
    const result = await getPaymentWithFallback(paymentId.toString(), initialShelterId)

    if (!result) {
      // Payment not found - could be a test webhook or invalid payment
      // Return 200 to acknowledge receipt (MercadoPago requires this for verification)
      console.warn('Could not fetch payment details - possibly a test webhook:', paymentId)
      return NextResponse.json({ received: true, warning: 'Payment not found' })
    }

    const { payment } = result

    // Parse the external reference to get our data
    let externalRef: { shelterId: string; animalId?: string; type: string } | null = null
    try {
      if (payment.external_reference) {
        externalRef = JSON.parse(payment.external_reference)
      }
    } catch {
      console.warn('Could not parse external reference')
    }

    // Map MercadoPago status to our status
    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'refunded'> = {
      pending: 'pending',
      approved: 'completed',
      authorized: 'pending',
      in_process: 'pending',
      in_mediation: 'pending',
      rejected: 'failed',
      cancelled: 'failed',
      refunded: 'refunded',
      charged_back: 'refunded',
    }

    const donationStatus = statusMap[payment.status || ''] || 'pending'

    // Only process if we have valid shelter info
    if (externalRef?.shelterId) {
      // Check if we already have this donation (by payment ID)
      const existingDonations = await db
        .select()
        .from(donations)
        .where(eq(donations.paymentId, paymentId.toString()))
        .limit(1)

      if (existingDonations.length > 0) {
        // Update existing donation
        await db
          .update(donations)
          .set({
            status: donationStatus,
            transactionId: payment.id?.toString(),
            updatedAt: new Date(),
          })
          .where(eq(donations.paymentId, paymentId.toString()))
      } else {
        // Create new donation record
        await db.insert(donations).values({
          shelterId: externalRef.shelterId,
          animalId: externalRef.animalId || null,
          amount: (payment.transaction_amount || 0).toFixed(2),
          currency: payment.currency_id || 'ARS',
          paymentMethod: 'mercadopago',
          status: donationStatus,
          donorName: payment.payer?.first_name
            ? `${payment.payer.first_name} ${payment.payer.last_name || ''}`
            : payment.metadata?.donor_name || null,
          donorEmail: payment.payer?.email || payment.metadata?.donor_email || null,
          paymentId: paymentId.toString(),
          transactionId: payment.id?.toString(),
          date: new Date().toISOString().split('T')[0],
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Always return 200 to acknowledge receipt (MercadoPago will retry otherwise)
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

// Also handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

