import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { db } from '@/lib/db'
import { shelterMercadopagoCredentials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Global fallback MercadoPago client (used when shelter has no connected account)
const globalAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

if (!globalAccessToken) {
  console.warn('MERCADOPAGO_ACCESS_TOKEN not configured - fallback payment features disabled')
}

export const globalMercadopago = globalAccessToken
  ? new MercadoPagoConfig({ accessToken: globalAccessToken })
  : null

export const globalPreferenceClient = globalMercadopago ? new Preference(globalMercadopago) : null
export const globalPaymentClient = globalMercadopago ? new Payment(globalMercadopago) : null

// Keep old exports for backward compatibility
export const mercadopago = globalMercadopago
export const preferenceClient = globalPreferenceClient
export const paymentClient = globalPaymentClient

/**
 * Get MercadoPago credentials for a specific shelter
 */
export async function getShelterMercadopagoCredentials(shelterId: string) {
  const [credentials] = await db
    .select()
    .from(shelterMercadopagoCredentials)
    .where(eq(shelterMercadopagoCredentials.shelterId, shelterId))
    .limit(1)

  return credentials || null
}

/**
 * Refresh MercadoPago tokens if they're expired or about to expire
 */
export async function refreshShelterTokensIfNeeded(shelterId: string) {
  const credentials = await getShelterMercadopagoCredentials(shelterId)
  if (!credentials) return null

  // Check if token expires in less than 1 hour
  const expiresAt = new Date(credentials.expiresAt)
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)

  if (expiresAt > oneHourFromNow) {
    // Token still valid
    return credentials
  }

  // Need to refresh the token
  const appId = process.env.MERCADOPAGO_APP_ID
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET

  if (!appId || !clientSecret) {
    console.error('Cannot refresh token: MERCADOPAGO_APP_ID or CLIENT_SECRET not configured')
    return credentials // Return existing even if expired, let it fail gracefully
  }

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: appId,
        client_secret: clientSecret,
        refresh_token: credentials.refreshToken,
      }),
    })

    if (!response.ok) {
      console.error('Failed to refresh MercadoPago token:', await response.text())
      return credentials
    }

    const tokenData = await response.json()
    const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    // Update credentials in database
    await db
      .update(shelterMercadopagoCredentials)
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: newExpiresAt,
        publicKey: tokenData.public_key || credentials.publicKey,
        updatedAt: new Date(),
      })
      .where(eq(shelterMercadopagoCredentials.shelterId, shelterId))

    return {
      ...credentials,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: newExpiresAt,
    }
  } catch (error) {
    console.error('Error refreshing MercadoPago token:', error)
    return credentials
  }
}

/**
 * Get a MercadoPago Preference client for a specific shelter
 * Falls back to global client if shelter has no connected account
 */
export async function getShelterPreferenceClient(shelterId: string) {
  const credentials = await refreshShelterTokensIfNeeded(shelterId)

  if (credentials?.accessToken) {
    const config = new MercadoPagoConfig({ accessToken: credentials.accessToken })
    return new Preference(config)
  }

  // Fallback to global client
  return globalPreferenceClient
}

/**
 * Get a MercadoPago Payment client for a specific shelter
 * Falls back to global client if shelter has no connected account
 */
export async function getShelterPaymentClient(shelterId: string) {
  const credentials = await refreshShelterTokensIfNeeded(shelterId)

  if (credentials?.accessToken) {
    const config = new MercadoPagoConfig({ accessToken: credentials.accessToken })
    return new Payment(config)
  }

  // Fallback to global client
  return globalPaymentClient
}

export interface CreatePreferenceParams {
  title: string
  description: string
  amount: number
  currency: string
  shelterName: string
  shelterId: string
  animalId?: string
  animalName?: string
  donorEmail?: string
  donorName?: string
  backUrls: {
    success: string
    failure: string
    pending: string
  }
  notificationUrl: string
}

export async function createDonationPreference(params: CreatePreferenceParams) {
  // Try to use shelter-specific credentials first
  const shelterPreferenceClient = await getShelterPreferenceClient(params.shelterId)

  if (!shelterPreferenceClient) {
    throw new Error('MercadoPago not configured')
  }

  const preference = await shelterPreferenceClient.create({
    body: {
      items: [
        {
          id: `donation-${params.shelterId}${params.animalId ? `-${params.animalId}` : ''}`,
          title: params.title,
          description: params.description,
          quantity: 1,
          currency_id: params.currency === 'ARS' ? 'ARS' : 'USD',
          unit_price: params.amount,
        },
      ],
      payer: params.donorEmail
        ? {
            email: params.donorEmail,
            name: params.donorName,
          }
        : undefined,
      back_urls: params.backUrls,
      auto_return: 'approved',
      notification_url: params.notificationUrl,
      external_reference: JSON.stringify({
        shelterId: params.shelterId,
        animalId: params.animalId,
        type: 'donation',
      }),
      metadata: {
        shelter_id: params.shelterId,
        animal_id: params.animalId,
        shelter_name: params.shelterName,
        animal_name: params.animalName,
        donor_name: params.donorName,
        donor_email: params.donorEmail,
      },
    },
  })

  return preference
}

/**
 * Get payment details using shelter-specific credentials
 */
export async function getPaymentDetails(paymentId: string, shelterId?: string) {
  let paymentClientToUse = globalPaymentClient

  if (shelterId) {
    paymentClientToUse = await getShelterPaymentClient(shelterId)
  }

  if (!paymentClientToUse) {
    throw new Error('MercadoPago not configured')
  }

  const payment = await paymentClientToUse.get({ id: paymentId })
  return payment
}

