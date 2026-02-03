import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { animals, shelters, animalPhotos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowLeft, Pencil, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import PhotoGallery from '@/components/animals/PhotoGallery'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AnimalDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  const [animal] = await db
    .select({
      id: animals.id,
      name: animals.name,
      species: animals.species,
      breed: animals.breed,
      age: animals.age,
      status: animals.status,
      description: animals.description,
      shelterId: animals.shelterId,
      shelterName: shelters.name,
      createdAt: animals.createdAt,
      updatedAt: animals.updatedAt,
    })
    .from(animals)
    .leftJoin(shelters, eq(animals.shelterId, shelters.id))
    .where(eq(animals.id, id))
    .limit(1)

  if (!animal) {
    notFound()
  }

  // Get photos
  const photos = await db
    .select()
    .from(animalPhotos)
    .where(eq(animalPhotos.animalId, id))
    .orderBy(animalPhotos.isPrimary)

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

  const statusVariants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    available: 'default',
    adopted: 'secondary',
    in_treatment: 'outline',
    deceased: 'destructive',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/animals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>
            <p className="text-muted-foreground">
              {speciesLabels[animal.species] || animal.species}
              {animal.breed && ` · ${animal.breed}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {animal.status === 'available' && (
            <Button variant="outline" asChild>
              <Link href={`/animals/${animal.id}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver página pública
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/dashboard/animals/${animal.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Photos */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle>Fotos</CardTitle>
            <CardDescription>
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoGallery
              photos={photos.map((p) => ({
                id: p.id,
                url: p.url,
                isPrimary: p.isPrimary || false,
              }))}
              animalName={animal.name}
            />
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Datos básicos del animal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Especie
                </p>
                <p className="text-lg">
                  {speciesLabels[animal.species] || animal.species}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Raza</p>
                <p className="text-lg">{animal.breed || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Edad</p>
                <p className="text-lg">
                  {animal.age ? `${animal.age} meses` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estado
                </p>
                <div className="mt-1">
                  <Badge variant={statusVariants[animal.status] || 'outline'}>
                    {statusLabels[animal.status] || animal.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Refugio
              </p>
              <p className="text-lg">{animal.shelterName || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
            <CardDescription>
              Información adicional sobre el animal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {animal.description || 'No hay descripción disponible.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-6 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Creado:</span>{' '}
              {new Date(animal.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p>
              <span className="font-medium">Actualizado:</span>{' '}
              {new Date(animal.updatedAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
