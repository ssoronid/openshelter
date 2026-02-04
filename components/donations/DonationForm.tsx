'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface Shelter {
  id: string
  name: string
}

interface Animal {
  id: string
  name: string
}

interface Props {
  shelterId?: string
  onSuccess?: () => void
}

export default function DonationForm({ shelterId: initialShelterId, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [formData, setFormData] = useState({
    shelterId: initialShelterId || '',
    animalId: '',
    amount: '',
    currency: 'ARS',
    paymentMethod: 'cash',
    status: 'completed',
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    message: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchShelters()
  }, [])

  useEffect(() => {
    if (formData.shelterId) {
      fetchAnimals(formData.shelterId)
    }
  }, [formData.shelterId])

  const fetchShelters = async () => {
    try {
      const response = await fetch('/api/shelters')
      const data = await response.json()
      if (response.ok) {
        setShelters(data.data || [])
        if (data.data?.length === 1 && !initialShelterId) {
          setFormData((prev) => ({ ...prev, shelterId: data.data[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching shelters:', error)
    }
  }

  const fetchAnimals = async (shelterId: string) => {
    try {
      const response = await fetch(`/api/animals?shelterId=${shelterId}`)
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
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          animalId: formData.animalId || undefined,
        }),
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/dashboard/donations')
          router.refresh()
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Error al registrar donación')
      }
    } catch (error) {
      console.error('Error creating donation:', error)
      alert('Error al registrar donación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Donación</CardTitle>
        <CardDescription>
          Registra una donación recibida manualmente (efectivo, transferencia, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shelter Selection */}
          {!initialShelterId && (
            <div className="space-y-2">
              <Label htmlFor="shelterId">Refugio *</Label>
              <Select
                value={formData.shelterId}
                onValueChange={(value) =>
                  setFormData({ ...formData, shelterId: value, animalId: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un refugio" />
                </SelectTrigger>
                <SelectContent>
                  {shelters.map((shelter) => (
                    <SelectItem key={shelter.id} value={shelter.id}>
                      {shelter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Animal Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="animalId">Animal (opcional)</Label>
            <Select
              value={formData.animalId}
              onValueChange={(value) =>
                setFormData({ ...formData, animalId: value === 'none' ? '' : value })
              }
              disabled={!formData.shelterId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Donación general al refugio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Donación general al refugio</SelectItem>
                {animals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount and Currency */}
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
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS (Peso Argentino)</SelectItem>
                  <SelectItem value="USD">USD (Dólar)</SelectItem>
                  <SelectItem value="BRL">BRL (Real)</SelectItem>
                  <SelectItem value="MXN">MXN (Peso Mexicano)</SelectItem>
                  <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Method and Status */}
          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          {/* Donor Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Información del Donante (opcional)</h3>

            <div className="space-y-2">
              <Label htmlFor="donorName">Nombre</Label>
              <Input
                id="donorName"
                value={formData.donorName}
                onChange={(e) =>
                  setFormData({ ...formData, donorName: e.target.value })
                }
                placeholder="Nombre del donante"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorEmail">Email</Label>
                <Input
                  id="donorEmail"
                  type="email"
                  value={formData.donorEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, donorEmail: e.target.value })
                  }
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="donorPhone">Teléfono</Label>
                <Input
                  id="donorPhone"
                  type="tel"
                  value={formData.donorPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, donorPhone: e.target.value })
                  }
                  placeholder="+54 11 1234 5678"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje / Notas</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={3}
              placeholder="Notas adicionales sobre la donación..."
            />
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
            <Button type="submit" disabled={loading || !formData.shelterId}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Donación'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


