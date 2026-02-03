import Link from 'next/link'
import { Dog, Cat, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  animal: {
    id: string
    name: string
    species: string
    breed?: string | null
    age?: number | null
    description?: string | null
    shelterName?: string | null
    primaryPhoto?: string | null
  }
}

export default function AnimalCard({ animal }: Props) {
  const speciesLabels: Record<string, string> = {
    dog: 'Perro',
    cat: 'Gato',
    other: 'Otro',
  }

  const SpeciesIcon = animal.species === 'cat' ? Cat : Dog

  const formatAge = (months: number) => {
    if (months < 12) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`
    }
    const years = Math.floor(months / 12)
    return `${years} ${years === 1 ? 'año' : 'años'}`
  }

  return (
    <Link href={`/animals/${animal.id}`}>
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 h-full">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {animal.primaryPhoto ? (
            <img
              src={animal.primaryPhoto}
              alt={animal.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <SpeciesIcon className="h-16 w-16 text-primary/30" />
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <Heart className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {/* Species badge */}
          <Badge className="absolute top-3 left-3" variant="secondary">
            {speciesLabels[animal.species] || animal.species}
          </Badge>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {animal.name}
          </h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            {animal.breed && <p>{animal.breed}</p>}
            {animal.age && <p>{formatAge(animal.age)}</p>}
            {animal.shelterName && (
              <p className="text-xs truncate">{animal.shelterName}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

