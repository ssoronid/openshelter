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

interface Props {
  animalId?: string
}

export default function AnimalForm({ animalId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: '',
    status: 'available',
    description: '',
    shelterId: '',
  })

  useEffect(() => {
    fetchShelters()
    if (animalId) fetchAnimal()
  }, [animalId])

  const fetchShelters = async () => {
    try {
      const response = await fetch('/api/shelters')
      const data = await response.json()
      if (response.ok && data.data) {
        setShelters(data.data)
        if (data.data.length > 0 && !formData.shelterId) {
          setFormData((prev) => ({ ...prev, shelterId: data.data[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching shelters:', error)
    }
  }

  const fetchAnimal = async () => {
    try {
      const response = await fetch(`/api/animals/${animalId}`)
      const data = await response.json()
      if (response.ok && data.data) {
        setFormData({
          name: data.data.name || '',
          species: data.data.species || 'dog',
          breed: data.data.breed || '',
          age: data.data.age?.toString() || '',
          status: data.data.status || 'available',
          description: data.data.description || '',
          shelterId: data.data.shelterId || '',
        })
      }
    } catch (error) {
      console.error('Error fetching animal:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
      }

      const url = animalId ? `/api/animals/${animalId}` : '/api/animals'
      const method = animalId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/dashboard/animals')
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al guardar animal')
      }
    } catch (error) {
      console.error('Error saving animal:', error)
      alert('Error al guardar animal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{animalId ? 'Editar Animal' : 'Nuevo Animal'}</CardTitle>
          <CardDescription>
            {animalId
              ? 'Modifica la información del animal'
              : 'Completa los datos para registrar un nuevo animal'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shelterId">Refugio *</Label>
            <Select
              value={formData.shelterId}
              onValueChange={(value) =>
                setFormData({ ...formData, shelterId: value })
              }
              required
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

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Nombre del animal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="species">Especie *</Label>
              <Select
                value={formData.species}
                onValueChange={(value) =>
                  setFormData({ ...formData, species: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona especie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Perro</SelectItem>
                  <SelectItem value="cat">Gato</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Raza</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
                placeholder="Raza del animal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Edad (meses)</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                min="0"
                placeholder="Edad en meses"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="adopted">Adoptado</SelectItem>
                  <SelectItem value="in_treatment">En tratamiento</SelectItem>
                  <SelectItem value="deceased">Fallecido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              placeholder="Descripción del animal, personalidad, necesidades especiales..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/animals')}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
