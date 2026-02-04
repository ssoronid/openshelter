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

export default function ExpenseForm({ shelterId: initialShelterId, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [formData, setFormData] = useState({
    shelterId: initialShelterId || '',
    animalId: '',
    category: 'other',
    description: '',
    amount: '',
    currency: 'ARS',
    date: new Date().toISOString().split('T')[0],
    receipt: '',
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
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          animalId: formData.animalId || undefined,
          receipt: formData.receipt || undefined,
        }),
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/dashboard/expenses')
          router.refresh()
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Error al registrar gasto')
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Error al registrar gasto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Gasto</CardTitle>
        <CardDescription>
          Registra un gasto del refugio o relacionado con un animal
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

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Alimentación</SelectItem>
                <SelectItem value="medical">Médico/Veterinario</SelectItem>
                <SelectItem value="shelter">Mantenimiento</SelectItem>
                <SelectItem value="supplies">Suministros</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="utilities">Servicios</SelectItem>
                <SelectItem value="salary">Salarios</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={3}
              placeholder="Describe el gasto..."
            />
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

          {/* Animal Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="animalId">Animal relacionado (opcional)</Label>
            <Select
              value={formData.animalId}
              onValueChange={(value) =>
                setFormData({ ...formData, animalId: value === 'none' ? '' : value })
              }
              disabled={!formData.shelterId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Gasto general del refugio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Gasto general del refugio</SelectItem>
                {animals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Receipt URL */}
          <div className="space-y-2">
            <Label htmlFor="receipt">URL del Recibo (opcional)</Label>
            <Input
              id="receipt"
              type="url"
              value={formData.receipt}
              onChange={(e) =>
                setFormData({ ...formData, receipt: e.target.value })
              }
              placeholder="https://..."
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
            <Button
              type="submit"
              disabled={loading || !formData.shelterId || !formData.description}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Gasto'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


