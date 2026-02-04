import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelterMercadopagoCredentials, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface MercadoPagoTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  user_id: number
  refresh_token: string
  public_key: string
}

interface MercadoPagoUserResponse {
  id: number
  nickname: string
  email: string
  site_id: string
}

// GET /api/mercadopago/oauth/callback
// Handles the OAuth callback from MercadoPago
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/signin`)
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    if (error) {
      console.error('OAuth error from MercadoPago:', error)
      return NextResponse.redirect(
        `${baseUrl}/dashboard/shelters?error=oauth_denied`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/shelters?error=invalid_callback`
      )
    }

    // Decode state to get shelterId
    let shelterId: string
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
      shelterId = decoded.shelterId
    } catch {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/shelters?error=invalid_state`
      )
    }

    // Verify user is still admin of this shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, shelterId),
          eq(userRoles.role, 'admin')
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/shelters?error=unauthorized`
      )
    }

    const appId = process.env.MERCADOPAGO_APP_ID
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET
    const redirectUri = `${baseUrl}/api/mercadopago/oauth/callback`

    if (!appId || !clientSecret) {
      console.error('MercadoPago credentials not configured')
      return NextResponse.redirect(
        `${baseUrl}/dashboard/shelters/${shelterId}/settings?error=config_error`
      )
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      let errorData: any
      try {
        errorData = await tokenResponse.json()
      } catch {
        errorData = await tokenResponse.text()
      }
      
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        appId: appId,
        redirectUri: redirectUri,
        hasClientSecret: !!clientSecret,
        clientSecretLength: clientSecret?.length,
        codeLength: code?.length,
      })
      
      // Include error details in URL for debugging (be careful not to expose secrets)
      const errorMessage = typeof errorData === 'string' 
        ? errorData.substring(0, 100) 
        : errorData?.message || errorData?.error || 'unknown_error'
      
      return NextResponse.redirect(
        `${baseUrl}/dashboard/shelters/${shelterId}/settings?error=token_exchange_failed&details=${encodeURIComponent(errorMessage)}`
      )
    }

    const tokenData: MercadoPagoTokenResponse = await tokenResponse.json()

    // Get user info from MercadoPago
    const userResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    let userData: MercadoPagoUserResponse | null = null
    if (userResponse.ok) {
      userData = await userResponse.json()
    }

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    // Upsert credentials - update if exists, insert if not
    const existing = await db
      .select()
      .from(shelterMercadopagoCredentials)
      .where(eq(shelterMercadopagoCredentials.shelterId, shelterId))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(shelterMercadopagoCredentials)
        .set({
          mpUserId: tokenData.user_id.toString(),
          mpNickname: userData?.nickname || null,
          mpEmail: userData?.email || null,
          mpSiteId: userData?.site_id || null,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
          publicKey: tokenData.public_key || null,
          updatedAt: new Date(),
        })
        .where(eq(shelterMercadopagoCredentials.shelterId, shelterId))
    } else {
      await db.insert(shelterMercadopagoCredentials).values({
        shelterId,
        mpUserId: tokenData.user_id.toString(),
        mpNickname: userData?.nickname || null,
        mpEmail: userData?.email || null,
        mpSiteId: userData?.site_id || null,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        publicKey: tokenData.public_key || null,
      })
    }

    return NextResponse.redirect(
      `${baseUrl}/dashboard/shelters/${shelterId}/settings?success=mercadopago_connected`
    )
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${baseUrl}/dashboard/shelters?error=callback_error`
    )
  }
}


