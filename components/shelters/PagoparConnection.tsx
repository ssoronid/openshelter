'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, Save } from 'lucide-react'

interface Props {
  shelterId: string
  isConnected: boolean
  commerceName: string | null
  lastUpdated: string | null
}

export default function PagoparConnection({
  shelterId,
  isConnected,
  commerceName,
  lastUpdated,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [formData, setFormData] = useState({
    publicKey: '',
    privateKey: '',
    commerceName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleConnect = async () => {
    // Validate
    const newErrors: Record<string, string> = {}
    if (!formData.publicKey.trim()) {
      newErrors.publicKey = 'La clave pública es requerida'
    }
    if (!formData.privateKey.trim()) {
      newErrors.privateKey = 'La clave privada es requerida'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const response = await fetch('/api/pagopar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelterId,
          ...formData,
        }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        setErrors({ form: data.error || 'Error al conectar Pagopar' })
      }
    } catch (error) {
      console.error('Error connecting Pagopar:', error)
      setErrors({ form: 'Error de red al conectar Pagopar' })
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (
      !confirm(
        '¿Estás seguro de que deseas desconectar Pagopar? Las donaciones por este medio no se procesarán hasta que vuelvas a conectar.'
      )
    ) {
      return
    }

    setDisconnecting(true)
    try {
      const response = await fetch('/api/pagopar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelterId }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Error al desconectar Pagopar')
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Error al desconectar Pagopar')
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
          {commerceName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comercio:</span>
              <span className="font-medium">{commerceName}</span>
            </div>
          )}
          {lastUpdated && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última actualización:</span>
              <span className="font-medium">
                {new Date(lastUpdated).toLocaleDateString('es-PY', {
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
          Las donaciones se procesarán a través de Pagopar y se depositarán en tu cuenta
          configurada.
        </p>

        <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
          {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Desconectar
        </Button>
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
        Conecta tu cuenta de Pagopar para recibir donaciones en Paraguay. Obtén tus claves desde
        la opción &quot;Integrar con mi sitio web&quot; en{' '}
        <a
          href="https://www.pagopar.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Pagopar.com
        </a>
        .
      </p>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
        <strong>Métodos de pago disponibles en Paraguay:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Tarjetas de crédito/débito (Bancard, Procard)</li>
          <li>Tigo Money, Billetera Personal, Zimple, Wally</li>
          <li>Pago QR, Transferencia bancaria</li>
          <li>Aqui Pago, Pago Express, PIX</li>
        </ul>
      </div>

      {errors.form && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {errors.form}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="commerceName">Nombre del comercio (opcional)</Label>
          <Input
            id="commerceName"
            value={formData.commerceName}
            onChange={(e) => setFormData({ ...formData, commerceName: e.target.value })}
            placeholder="Mi Refugio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="publicKey">Clave Pública (Public Key)</Label>
          <Input
            id="publicKey"
            value={formData.publicKey}
            onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
            placeholder="63820974a40fe7c5c5c53c429af8b25bed599dbf"
            className={errors.publicKey ? 'border-destructive' : ''}
          />
          {errors.publicKey && <p className="text-sm text-destructive">{errors.publicKey}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="privateKey">Clave Privada (Private Key)</Label>
          <div className="relative">
            <Input
              id="privateKey"
              type={showPrivateKey ? 'text' : 'password'}
              value={formData.privateKey}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              placeholder="••••••••••••••••••••••••••••••••••••••••"
              className={errors.privateKey ? 'border-destructive pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.privateKey && <p className="text-sm text-destructive">{errors.privateKey}</p>}
          <p className="text-xs text-muted-foreground">
            La clave privada se almacena de forma segura y nunca se comparte.
          </p>
        </div>

        <Button onClick={handleConnect} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar credenciales
        </Button>
      </div>
    </div>
  )
}

