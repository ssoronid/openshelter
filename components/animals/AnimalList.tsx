'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Animal {
  id: string
  name: string
  species: string
  breed?: string
  age?: number
  status: string
}

export default function AnimalList() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', species: '' })

  useEffect(() => {
    fetchAnimals()
  }, [filter])

  const fetchAnimals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.species) params.append('species', filter.species)

      const response = await fetch(`/api/animals?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAnimals(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching animals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este animal?')) return

    try {
      const response = await fetch(`/api/animals/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setAnimals(animals.filter((a) => a.id !== id))
      }
    } catch (error) {
      console.error('Error deleting animal:', error)
    }
  }

  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    adopted: 'Adoptado',
    in_treatment: 'En tratamiento',
    deceased: 'Fallecido',
  }

  const speciesLabels: Record<string, string> = {
    dog: 'Perro',
    cat: 'Gato',
    other: 'Otro',
  }

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    adopted: 'bg-blue-100 text-blue-800',
    in_treatment: 'bg-yellow-100 text-yellow-800',
    deceased: 'bg-gray-100 text-gray-800',
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-500">Cargando animales...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="available">Disponible</option>
          <option value="adopted">Adoptado</option>
          <option value="in_treatment">En tratamiento</option>
        </select>
        <select
          value={filter.species}
          onChange={(e) => setFilter({ ...filter, species: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todas las especies</option>
          <option value="dog">Perro</option>
          <option value="cat">Gato</option>
          <option value="other">Otro</option>
        </select>
      </div>

      {/* Table */}
      {animals.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          No se encontraron animales
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Especie</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Raza</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Edad</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {animals.map((animal) => (
                <tr key={animal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{animal.name}</td>
                  <td className="px-6 py-4 text-gray-700">{speciesLabels[animal.species] || animal.species}</td>
                  <td className="px-6 py-4 text-gray-700">{animal.breed || '-'}</td>
                  <td className="px-6 py-4 text-gray-700">{animal.age ? `${animal.age}m` : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[animal.status] || 'bg-gray-100'}`}>
                      {statusLabels[animal.status] || animal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/animals/${animal.id}`} className="text-blue-600 hover:text-blue-800">
                        Ver
                      </Link>
                      <Link href={`/dashboard/animals/${animal.id}/edit`} className="text-indigo-600 hover:text-indigo-800">
                        Editar
                      </Link>
                      <button onClick={() => handleDelete(animal.id)} className="text-red-600 hover:text-red-800">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
