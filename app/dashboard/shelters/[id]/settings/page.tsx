import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { shelters, userRoles, shelterMercadopagoCredentials, shelterPagoparCredentials } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import MercadoPagoConnection from '@/components/shelters/MercadoPagoConnection'
import PagoparConnection from '@/components/shelters/PagoparConnection'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string; details?: string }>
}

export default async function ShelterSettingsPage({ params, searchParams }: Props) {
  const { id } = await params
  const { success, error, details } = await searchParams
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  // Verify user is admin of this shelter
  const [userRole] = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, session.user.id),
        eq(userRoles.shelterId, id),
        eq(userRoles.role, 'admin')
      )
    )
    .limit(1)

  if (!userRole) {
    redirect('/dashboard/shelters')
  }

  const [shelter] = await db
    .select()
    .from(shelters)
    .where(eq(shelters.id, id))
    .limit(1)

  if (!shelter) {
    notFound()
  }

  // Get MercadoPago credentials if they exist
  const [mpCredentials] = await db
    .select({
      mpNickname: shelterMercadopagoCredentials.mpNickname,
      mpEmail: shelterMercadopagoCredentials.mpEmail,
      mpUserId: shelterMercadopagoCredentials.mpUserId,
      expiresAt: shelterMercadopagoCredentials.expiresAt,
      updatedAt: shelterMercadopagoCredentials.updatedAt,
    })
    .from(shelterMercadopagoCredentials)
    .where(eq(shelterMercadopagoCredentials.shelterId, id))
    .limit(1)

  // Get Pagopar credentials if they exist
  const [pagoparCredentials] = await db
    .select({
      commerceName: shelterPagoparCredentials.commerceName,
      isActive: shelterPagoparCredentials.isActive,
      updatedAt: shelterPagoparCredentials.updatedAt,
    })
    .from(shelterPagoparCredentials)
    .where(eq(shelterPagoparCredentials.shelterId, id))
    .limit(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/shelters/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          </div>
          <p className="text-muted-foreground">
            Configuración de {shelter.name}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success === 'mercadopago_connected' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ¡MercadoPago conectado exitosamente! Ahora puedes recibir donaciones directamente.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg space-y-2">
          <div className="font-semibold">
            {error === 'oauth_denied' && 'Se canceló la conexión con MercadoPago.'}
            {error === 'token_exchange_failed' && 'Error al conectar con MercadoPago.'}
            {error === 'config_error' && 'Error de configuración del sistema.'}
            {!['oauth_denied', 'token_exchange_failed', 'config_error'].includes(error) && 
              'Ocurrió un error.'}
          </div>
          {error === 'token_exchange_failed' && (
            <div className="text-sm space-y-1">
              <p>Posibles causas:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>El redirect URI no está registrado en MercadoPago</li>
                <li>El Client Secret es incorrecto</li>
                <li>Las credenciales son de prueba (deben ser productivas)</li>
              </ul>
              {details && (
                <p className="mt-2 text-xs font-mono bg-red-100 p-2 rounded">
                  {decodeURIComponent(details)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* MercadoPago Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 48c13.255 0 24-10.745 24-24S37.255 0 24 0 0 10.745 0 24s10.745 24 24 24z" fill="#009EE3"/>
              <path d="M34.1 19.3c-.3-2.3-2.1-3.3-4.2-3.3h-9.3c-.6 0-1.1.4-1.2 1l-2.9 18.4c-.1.4.2.8.6.8h4.3l1.1-6.8v.2c.1-.6.6-1 1.2-1h2.5c4.9 0 8.7-2 9.8-7.7v-.2c-.1-1.4-.1-1.4-.1-1.4h.2z" fill="#fff"/>
              <path d="M35.3 20.7c-1.1 5.7-4.9 7.7-9.8 7.7h-2.5c-.6 0-1.1.4-1.2 1l-1.6 10.1c-.1.4.2.7.6.7h3.6c.5 0 1-.4 1-.9l1-6.3c.1-.5.5-.9 1-.9h.6c4.3 0 7.6-1.7 8.6-6.8.4-2 .2-3.6-.3-4.6" fill="#fff"/>
            </svg>
            Integración con MercadoPago
          </CardTitle>
          <CardDescription>
            Conecta tu cuenta de MercadoPago para recibir donaciones en Argentina, Paraguay, Brasil y más
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MercadoPagoConnection
            shelterId={id}
            isConnected={!!mpCredentials}
            mpEmail={mpCredentials?.mpEmail || null}
            mpNickname={mpCredentials?.mpNickname || null}
            lastUpdated={mpCredentials?.updatedAt?.toISOString() || null}
          />
        </CardContent>
      </Card>

      {/* Pagopar Integration (Paraguay) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="8" fill="#1a237e"/>
              <path d="M12 24h24M24 12v24" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="8" fill="#4caf50"/>
            </svg>
            Integración con Pagopar
          </CardTitle>
          <CardDescription>
            Conecta tu cuenta de Pagopar para recibir donaciones en Paraguay (Bancard, Tigo Money, Billetera Personal, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PagoparConnection
            shelterId={id}
            isConnected={!!pagoparCredentials?.isActive}
            commerceName={pagoparCredentials?.commerceName || null}
            lastUpdated={pagoparCredentials?.updatedAt?.toISOString() || null}
          />
        </CardContent>
      </Card>
    </div>
  )
}


