'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Loader2, PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AnimalCard from '@/components/public/AnimalCard'
import SearchFilters from '@/components/public/SearchFilters'

interface Animal {
  id: string
  name: string
  species: string
  breed?: string | null
  age?: number | null
  description?: string | null
  shelterName?: string | null
  primaryPhoto?: string | null
}

interface Shelter {
  id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AnimalsGalleryPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState('all')
  const [shelterId, setShelterId] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchAnimals = useCallback(async (page: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '12')
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (species !== 'all') params.append('species', species)
      if (shelterId) params.append('shelterId', shelterId)

      const response = await fetch(`/api/public/animals?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAnimals(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 })
        if (data.filters?.shelters) {
          setShelters(data.filters.shelters)
        }
      }
    } catch (error) {
      console.error('Error fetching animals:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, species, shelterId])

  useEffect(() => {
    fetchAnimals(1)
  }, [fetchAnimals])

  const handleClearFilters = () => {
    setSearch('')
    setSpecies('all')
    setShelterId('')
  }

  const handlePageChange = (newPage: number) => {
    fetchAnimals(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PawPrint className="h-6 w-6 text-primary" />
              OpenShelter
            </Link>
            <Link
              href="/signin"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Animales en Adopción
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encuentra a tu nuevo compañero. Todos nuestros animales están esperando
            un hogar lleno de amor.
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <SearchFilters
            search={search}
            species={species}
            shelterId={shelterId}
            shelters={shelters}
            onSearchChange={setSearch}
            onSpeciesChange={setSpecies}
            onShelterChange={setShelterId}
            onClear={handleClearFilters}
          />
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {pagination.total} {pagination.total === 1 ? 'animal encontrado' : 'animales encontrados'}
          </p>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Cargando animales...</span>
          </div>
        ) : animals.length === 0 ? (
          /* Empty state */
          <div className="text-center py-12">
            <PawPrint className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron animales
            </h3>
            <p className="text-muted-foreground mb-4">
              Intenta cambiar los filtros de búsqueda
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            {/* Animal grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {animals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} OpenShelter. Sistema open-source para refugios de animales.</p>
        </div>
      </footer>
    </div>
  )
}



