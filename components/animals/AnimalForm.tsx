'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-6">
        <div>
          <label htmlFor="shelterId" className="block text-sm font-medium text-gray-700 mb-1">
            Refugio *
          </label>
          <select
            id="shelterId"
            value={formData.shelterId}
            onChange={(e) => setFormData({ ...formData, shelterId: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona un refugio</option>
            {shelters.map((shelter) => (
              <option key={shelter.id} value={shelter.id}>{shelter.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">
              Especie *
            </label>
            <select
              id="species"
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dog">Perro</option>
              <option value="cat">Gato</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
              Raza
            </label>
            <input
              type="text"
              id="breed"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Edad (meses)
            </label>
            <input
              type="number"
              id="age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="available">Disponible</option>
              <option value="adopted">Adoptado</option>
              <option value="in_treatment">En tratamiento</option>
              <option value="deceased">Fallecido</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/animals')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
