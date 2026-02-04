'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Shelter {
  id: string
  name: string
}

interface Props {
  search: string
  species: string
  shelterId: string
  shelters: Shelter[]
  onSearchChange: (value: string) => void
  onSpeciesChange: (value: string) => void
  onShelterChange: (value: string) => void
  onClear: () => void
}

export default function SearchFilters({
  search,
  species,
  shelterId,
  shelters,
  onSearchChange,
  onSpeciesChange,
  onShelterChange,
  onClear,
}: Props) {
  const hasFilters = search || species !== 'all' || shelterId

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, raza..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-4">
        <Select value={species} onValueChange={onSpeciesChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Especie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las especies</SelectItem>
            <SelectItem value="dog">Perros</SelectItem>
            <SelectItem value="cat">Gatos</SelectItem>
            <SelectItem value="other">Otros</SelectItem>
          </SelectContent>
        </Select>

        {shelters.length > 0 && (
          <Select value={shelterId || 'all'} onValueChange={(v) => onShelterChange(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Refugio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los refugios</SelectItem>
              {shelters.map((shelter) => (
                <SelectItem key={shelter.id} value={shelter.id}>
                  {shelter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-1 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}


