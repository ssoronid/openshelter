import { db } from '@/lib/db'
import { animals, shelters, animalPhotos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import AdoptionForm from '@/components/adoptions/AdoptionForm'

export default async function PublicAnimalPage({
  params,
}: {
  params: { id: string }
}) {
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
      createdAt: animals.createdAt,
    })
    .from(animals)
    .leftJoin(shelters, eq(animals.shelterId, shelters.id))
    .where(eq(animals.id, params.id))
    .limit(1)

  if (!animal || animal.status !== 'available') {
    notFound()
  }

  const speciesLabels = {
    dog: 'Perro',
    cat: 'Gato',
    other: 'Otro',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 bg-gray-200 h-64 md:h-auto flex items-center justify-center">
                <span className="text-gray-400">Foto del animal</span>
              </div>
              <div className="md:w-1/2 p-6">
                <h1 className="text-3xl font-bold mb-2">{animal.name}</h1>
                <div className="space-y-2 mb-6">
                  <p>
                    <span className="font-medium">Especie:</span>{' '}
                    {speciesLabels[animal.species]}
                  </p>
                  {animal.breed && (
                    <p>
                      <span className="font-medium">Raza:</span> {animal.breed}
                    </p>
                  )}
                  {animal.age && (
                    <p>
                      <span className="font-medium">Edad:</span> {animal.age}{' '}
                      meses
                    </p>
                  )}
                  {animal.shelterName && (
                    <p>
                      <span className="font-medium">Refugio:</span>{' '}
                      {animal.shelterName}
                    </p>
                  )}
                </div>
                {animal.description && (
                  <div className="mb-6">
                    <h2 className="font-bold mb-2">Sobre {animal.name}</h2>
                    <p className="text-gray-700">{animal.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Solicitar Adopción</h2>
            <AdoptionForm animalId={animal.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

