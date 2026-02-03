'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Eye, Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    available: 'default',
    adopted: 'secondary',
    in_treatment: 'outline',
    deceased: 'destructive',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando animales...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={filter.status || 'all'}
          onValueChange={(value) =>
            setFilter({ ...filter, status: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="available">Disponible</SelectItem>
            <SelectItem value="adopted">Adoptado</SelectItem>
            <SelectItem value="in_treatment">En tratamiento</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.species || 'all'}
          onValueChange={(value) =>
            setFilter({ ...filter, species: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las especies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las especies</SelectItem>
            <SelectItem value="dog">Perro</SelectItem>
            <SelectItem value="cat">Gato</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {animals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontraron animales
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Especie</TableHead>
                <TableHead>Raza</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {animals.map((animal) => (
                <TableRow key={animal.id}>
                  <TableCell className="font-medium">{animal.name}</TableCell>
                  <TableCell>
                    {speciesLabels[animal.species] || animal.species}
                  </TableCell>
                  <TableCell>{animal.breed || '-'}</TableCell>
                  <TableCell>{animal.age ? `${animal.age}m` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[animal.status] || 'outline'}>
                      {statusLabels[animal.status] || animal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/animals/${animal.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/animals/${animal.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(animal.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
