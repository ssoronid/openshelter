'use client'

import { useState, useEffect } from 'react'

interface Animal {
  id: string
  name: string
  species: string
  breed?: string
  age?: number
  status: string
  description?: string
  shelterName?: string
  createdAt: string
}

interface AnimalListProps {
  initialAnimals?: Animal[]
}

export default function AnimalList({ initialAnimals = [] }: AnimalListProps) {
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    species: '',
    search: '',
  })
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchAnimals()
  }, [filters, page])

  const fetchAnimals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.status && { status: filters.status }),
        ...(filters.species && { species: filters.species }),
        ...(filters.search && { search: filters.search }),
      })

      const response = await fetch(`/api/animals?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAnimals(data.data)
      } else {
        console.error('Error fetching animals:', data.error)
      }
    } catch (error) {
      console.error('Error fetching animals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este animal?')) {
      return
    }

    try {
      const response = await fetch(`/api/animals/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAnimals(animals.filter((animal) => animal.id !== id))
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar animal')
      }
    } catch (error) {
      console.error('Error deleting animal:', error)
      alert('Error al eliminar animal')
    }
  }

  if (loading && animals.length === 0) {
    return <div className="text-center py-8">Cargando animales...</div>
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar..."
          value={filters.search}
          onChange={(e) => {
            setFilters({ ...filters, search: e.target.value })
            setPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <select
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value })
            setPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todos los estados</option>
          <option value="available">Disponible</option>
          <option value="adopted">Adoptado</option>
          <option value="in_treatment">En tratamiento</option>
          <option value="deceased">Fallecido</option>
        </select>
        <select
          value={filters.species}
          onChange={(e) => {
            setFilters({ ...filters, species: e.target.value })
            setPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todas las especies</option>
          <option value="dog">Perro</option>
          <option value="cat">Gato</option>
          <option value="other">Otro</option>
        </select>
      </div>

      {/* Animals Table */}
      {animals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No se encontraron animales
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Especie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Raza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Edad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {animals.map((animal) => (
                <tr key={animal.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{animal.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {animal.species === 'dog' ? 'Perro' : animal.species === 'cat' ? 'Gato' : 'Otro'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {animal.breed || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {animal.age ? `${animal.age} meses` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        animal.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : animal.status === 'adopted'
                          ? 'bg-blue-100 text-blue-800'
                          : animal.status === 'in_treatment'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {animal.status === 'available'
                        ? 'Disponible'
                        : animal.status === 'adopted'
                        ? 'Adoptado'
                        : animal.status === 'in_treatment'
                        ? 'En tratamiento'
                        : 'Fallecido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a
                      href={`/dashboard/animals/${animal.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Ver
                    </a>
                    <a
                      href={`/dashboard/animals/${animal.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </a>
                    <button
                      onClick={() => handleDelete(animal.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={animals.length < 20}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

