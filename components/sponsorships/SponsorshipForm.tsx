'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Animal {
  id: string
  name: string
  species: string
}

interface Props {
  animalId?: string
  onSuccess?: () => void
}

export default function SponsorshipForm({ animalId: initialAnimalId, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [formData, setFormData] = useState({
    animalId: initialAnimalId || '',
    sponsorName: '',
    sponsorEmail: '',
    amount: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: 'true',
    paymentMethod: 'bank_transfer',
  })

  useEffect(() => {
    fetchAnimals()
  }, [])

  const fetchAnimals = async () => {
    try {
      const response = await fetch('/api/animals?status=available')
      const data = await response.json()
      if (response.ok) {
        setAnimals(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching animals:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          endDate: formData.endDate || undefined,
        }),
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/dashboard/sponsorships')
          router.refresh()
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Error al crear apadrinamiento')
      }
    } catch (error) {
      console.error('Error creating sponsorship:', error)
      alert('Error al crear apadrinamiento')
    } finally {
      setLoading(false)
    }
  }

  const speciesLabels: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
    other: '🐾',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo Apadrinamiento</CardTitle>
        <CardDescription>
          Registra un nuevo padrino para un animal del refugio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Animal Selection */}
          {!initialAnimalId && (
            <div className="space-y-2">
              <Label htmlFor="animalId">Animal *</Label>
              <Select
                value={formData.animalId}
                onValueChange={(value) =>
                  setFormData({ ...formData, animalId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un animal" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {speciesLabels[animal.species] || '🐾'} {animal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sponsor Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Información del Padrino</h3>

            <div className="space-y-2">
              <Label htmlFor="sponsorName">Nombre *</Label>
              <Input
                id="sponsorName"
                value={formData.sponsorName}
                onChange={(e) =>
                  setFormData({ ...formData, sponsorName: e.target.value })
                }
                required
                placeholder="Nombre del padrino"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sponsorEmail">Email *</Label>
              <Input
                id="sponsorEmail"
                type="email"
                value={formData.sponsorEmail}
                onChange={(e) =>
                  setFormData({ ...formData, sponsorEmail: e.target.value })
                }
                required
                placeholder="email@ejemplo.com"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frecuencia</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentMethod: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                <SelectItem value="mercadopago">MercadoPago</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin (opcional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.animalId || !formData.sponsorName || !formData.sponsorEmail}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Apadrinamiento'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}



