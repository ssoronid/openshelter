import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/mercadopago/oauth/authorize?shelterId=xxx
// Generates the MercadoPago OAuth URL and redirects the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shelterId = searchParams.get('shelterId')

    if (!shelterId) {
      return NextResponse.json({ error: 'shelterId requerido' }, { status: 400 })
    }

    // Verify user is admin of this shelter
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
      return NextResponse.json(
        { error: 'Solo los administradores pueden conectar MercadoPago' },
        { status: 403 }
      )
    }

    const appId = process.env.MERCADOPAGO_APP_ID
    if (!appId) {
      return NextResponse.json(
        { error: 'MercadoPago APP_ID no configurado' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/mercadopago/oauth/callback`

    // State contains the shelterId to link the credentials after OAuth
    const state = Buffer.from(JSON.stringify({ shelterId })).toString('base64')

    // Build MercadoPago OAuth URL
    const oauthUrl = new URL('https://auth.mercadopago.com/authorization')
    oauthUrl.searchParams.set('client_id', appId)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('platform_id', 'mp')
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('state', state)

    return NextResponse.redirect(oauthUrl.toString())
  } catch (error) {
    console.error('Error initiating OAuth:', error)
    return NextResponse.json(
      { error: 'Error al iniciar OAuth' },
      { status: 500 }
    )
  }
}


