import { db } from '@/lib/db'
import { animals, shelters, animalPhotos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import AdoptionForm from '@/components/adoptions/AdoptionForm'
import PhotoGallery from '@/components/animals/PhotoGallery'
import Link from 'next/link'

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

  // Get photos
  const photos = await db
    .select()
    .from(animalPhotos)
    .where(eq(animalPhotos.animalId, id))
    .orderBy(animalPhotos.isPrimary)

  const speciesLabels: Record<string, string> = {
    dog: 'Perro',
    cat: 'Gato',
    other: 'Otro',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🐾 OpenShelter
          </Link>
          <Link
            href="/animals"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Ver todos los animales
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Photo Gallery */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
              <PhotoGallery
                photos={photos.map((p) => ({
                  id: p.id,
                  url: p.url,
                  isPrimary: p.isPrimary || false,
                }))}
                animalName={animal.name}
              />
            </div>

            {/* Animal Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{animal.name}</h1>
                <div className="space-y-3 mb-6">
                  <p className="text-gray-700">
                    <span className="font-medium">Especie:</span>{' '}
                    {speciesLabels[animal.species] || animal.species}
                  </p>
                  {animal.breed && (
                    <p className="text-gray-700">
                      <span className="font-medium">Raza:</span> {animal.breed}
                    </p>
                  )}
                  {animal.age && (
                    <p className="text-gray-700">
                      <span className="font-medium">Edad:</span>{' '}
                      {animal.age < 12
                        ? `${animal.age} meses`
                        : `${Math.floor(animal.age / 12)} año${Math.floor(animal.age / 12) > 1 ? 's' : ''}`}
                    </p>
                  )}
                  {animal.shelterName && (
                    <p className="text-gray-700">
                      <span className="font-medium">Refugio:</span> {animal.shelterName}
                    </p>
                  )}
                </div>
                {animal.description && (
                  <div>
                    <h2 className="font-bold text-gray-900 mb-2">Sobre {animal.name}</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{animal.description}</p>
                  </div>
                )}
              </div>

              {/* Adoption Form */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Adopción</h2>
                <AdoptionForm animalId={animal.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
