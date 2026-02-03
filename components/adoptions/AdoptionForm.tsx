'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Props {
  animalId: string
}

export default function AdoptionForm({ animalId }: Props) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    applicantAddress: '',
    applicantCity: '',
    applicantCountry: '',
    reason: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/adoptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, animalId }),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const data = await response.json()
        alert(data.error || 'Error al enviar solicitud')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Error al enviar solicitud')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800">¡Solicitud enviada!</AlertTitle>
        <AlertDescription className="text-green-700">
          Tu solicitud de adopción ha sido enviada. El refugio se pondrá en
          contacto contigo pronto.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitud de Adopción</CardTitle>
        <CardDescription>
          Completa tus datos para aplicar a la adopción de este animal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="applicantName">Nombre completo *</Label>
            <Input
              id="applicantName"
              value={formData.applicantName}
              onChange={(e) =>
                setFormData({ ...formData, applicantName: e.target.value })
              }
              required
              placeholder="Tu nombre completo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicantEmail">Email *</Label>
              <Input
                type="email"
                id="applicantEmail"
                value={formData.applicantEmail}
                onChange={(e) =>
                  setFormData({ ...formData, applicantEmail: e.target.value })
                }
                required
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantPhone">Teléfono *</Label>
              <Input
                type="tel"
                id="applicantPhone"
                value={formData.applicantPhone}
                onChange={(e) =>
                  setFormData({ ...formData, applicantPhone: e.target.value })
                }
                required
                placeholder="+54 11 1234 5678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantAddress">Dirección</Label>
            <Input
              id="applicantAddress"
              value={formData.applicantAddress}
              onChange={(e) =>
                setFormData({ ...formData, applicantAddress: e.target.value })
              }
              placeholder="Tu dirección"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicantCity">Ciudad</Label>
              <Input
                id="applicantCity"
                value={formData.applicantCity}
                onChange={(e) =>
                  setFormData({ ...formData, applicantCity: e.target.value })
                }
                placeholder="Tu ciudad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantCountry">País</Label>
              <Input
                id="applicantCountry"
                value={formData.applicantCountry}
                onChange={(e) =>
                  setFormData({ ...formData, applicantCountry: e.target.value })
                }
                placeholder="Tu país"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">¿Por qué quieres adoptar?</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={4}
              placeholder="Cuéntanos por qué quieres adoptar a este animal..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitud de Adopción'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
