import { db } from '@/lib/db'
import { animals, shelters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PawPrint, Camera } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import AdoptionForm from '@/components/adoptions/AdoptionForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PublicAnimalPage({ params }: Props) {
  const { id } = await params
  const [animal] = await db
    .select({
      id: animals.id,
      name: animals.name,
      species: animals.species,
      breed: animals.breed,
      age: animals.age,
      status: animals.status,
      description: animals.description,
      shelterName: shelters.name,
    })
    .from(animals)
    .leftJoin(shelters, eq(animals.shelterId, shelters.id))
    .where(eq(animals.id, id))
    .limit(1)

  if (!animal || animal.status !== 'available') {
    notFound()
  }

  const speciesLabels: Record<string, string> = {
    dog: 'Perro',
    cat: 'Gato',
    other: 'Otro',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="rounded-full bg-primary p-1.5">
              <PawPrint className="h-4 w-4 text-primary-foreground" />
            </div>
            OpenShelter
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Animal Card */}
          <Card className="overflow-hidden">
            <div className="md:flex">
              {/* Image Placeholder */}
              <div className="md:w-1/2 bg-muted h-64 md:h-auto flex flex-col items-center justify-center gap-3">
                <Camera className="h-12 w-12 text-muted-foreground/50" />
                <span className="text-muted-foreground text-sm">
                  Foto del animal
                </span>
              </div>

              {/* Info */}
              <div className="md:w-1/2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl">{animal.name}</CardTitle>
                      <CardDescription className="text-base">
                        {speciesLabels[animal.species] || animal.species}
                        {animal.breed && ` · ${animal.breed}`}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Disponible</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {animal.age && (
                      <div>
                        <p className="text-muted-foreground">Edad</p>
                        <p className="font-medium">{animal.age} meses</p>
                      </div>
                    )}
                    {animal.shelterName && (
                      <div>
                        <p className="text-muted-foreground">Refugio</p>
                        <p className="font-medium">{animal.shelterName}</p>
                      </div>
                    )}
                  </div>

                  {animal.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Sobre {animal.name}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {animal.description}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Adoption Form */}
          <AdoptionForm animalId={animal.id} />
        </div>
      </div>
    </div>
  )
}
