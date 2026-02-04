'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react'

interface Props {
  shelterId: string
  isConnected: boolean
  mpEmail: string | null
  mpNickname: string | null
  lastUpdated: string | null
}

export default function MercadoPagoConnection({
  shelterId,
  isConnected,
  mpEmail,
  mpNickname,
  lastUpdated,
}: Props) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)

  const handleConnect = () => {
    // Redirect to OAuth authorize endpoint
    window.location.href = `/api/mercadopago/oauth/authorize?shelterId=${shelterId}`
  }

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar MercadoPago? Las donaciones no se procesarán hasta que vuelvas a conectar.')) {
      return
    }

    setDisconnecting(true)
    try {
      const response = await fetch('/api/mercadopago/oauth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelterId }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Error al desconectar MercadoPago')
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Error al desconectar MercadoPago')
    } finally {
      setDisconnecting(false)
    }
  }

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-600 hover:bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Conectado
          </Badge>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          {mpNickname && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usuario:</span>
              <span className="font-medium">{mpNickname}</span>
            </div>
          )}
          {mpEmail && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{mpEmail}</span>
            </div>
          )}
          {lastUpdated && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última actualización:</span>
              <span className="font-medium">
                {new Date(lastUpdated).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Las donaciones se depositarán directamente en esta cuenta de MercadoPago.
        </p>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleConnect}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Reconectar cuenta
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Desconectar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          <XCircle className="mr-1 h-3 w-3" />
          No conectado
        </Badge>
      </div>

      <p className="text-muted-foreground">
        Conecta tu cuenta de MercadoPago para que las donaciones se depositen directamente
        en tu cuenta. Esto permite la contabilidad automática de todas las donaciones recibidas.
      </p>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
        <strong>Beneficios de conectar MercadoPago:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Recibe donaciones directamente en tu cuenta</li>
          <li>Registro automático de todas las transacciones</li>
          <li>Estadísticas de donaciones en tiempo real</li>
          <li>Notificaciones de cada donación recibida</li>
        </ul>
      </div>

      <Button onClick={handleConnect} className="w-full sm:w-auto">
        <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 48c13.255 0 24-10.745 24-24S37.255 0 24 0 0 10.745 0 24s10.745 24 24 24z" fill="#fff"/>
          <path d="M34.1 19.3c-.3-2.3-2.1-3.3-4.2-3.3h-9.3c-.6 0-1.1.4-1.2 1l-2.9 18.4c-.1.4.2.8.6.8h4.3l1.1-6.8v.2c.1-.6.6-1 1.2-1h2.5c4.9 0 8.7-2 9.8-7.7v-.2c-.1-1.4-.1-1.4-.1-1.4h.2z" fill="#009EE3"/>
        </svg>
        Conectar MercadoPago
      </Button>
    </div>
  )
}


