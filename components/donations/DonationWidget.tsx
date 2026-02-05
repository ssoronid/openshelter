'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
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
  shelterId: string
  shelterName: string
  animals?: Animal[]
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000]

export default function DonationWidget({ shelterId, shelterName, animals = [] }: Props) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState<number | ''>('')
  const [customAmount, setCustomAmount] = useState('')
  const [animalId, setAnimalId] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')

  const speciesLabels: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
    other: '🐾',
  }

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) {
      setAmount(num)
    } else {
      setAmount('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || amount <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/payments/mercadopago/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelterId,
          animalId: animalId || undefined,
          amount,
          currency: 'ARS',
          donorName: donorName || undefined,
          donorEmail: donorEmail || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok && data.init_point) {
        // Redirect to MercadoPago
        window.location.href = data.init_point
      } else {
        alert(data.error || 'Error al procesar el pago')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Error al procesar el pago. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Realizar Donación
        </CardTitle>
        <CardDescription>
          Selecciona el monto que deseas donar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preset Amounts */}
          <div className="space-y-3">
            <Label>Monto sugerido (ARS)</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  type="button"
                  variant={amount === presetAmount ? 'default' : 'outline'}
                  onClick={() => handlePresetClick(presetAmount)}
                  className="h-12"
                >
                  ${presetAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="customAmount">O ingresa otro monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="customAmount"
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Ingresa el monto"
                className="pl-8"
              />
            </div>
          </div>

          {/* Animal Selection */}
          {animals.length > 0 && (
            <div className="space-y-2">
              <Label>Donar para un animal específico (opcional)</Label>
              <Select
                value={animalId}
                onValueChange={(value) => setAnimalId(value === 'general' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Donación general al refugio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Donación general al refugio</SelectItem>
                  {animals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {speciesLabels[animal.species] || '🐾'} {animal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Donor Info (Optional) */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Información del donante (opcional)
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorName">Nombre</Label>
                <Input
                  id="donorName"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="donorEmail">Email</Label>
                <Input
                  id="donorEmail"
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={loading || !amount || amount <= 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Donar {amount ? `$${amount.toLocaleString()} ARS` : ''}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}



