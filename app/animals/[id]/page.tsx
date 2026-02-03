import { db } from '@/lib/db'
import { animals, shelters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import AdoptionForm from '@/components/adoptions/AdoptionForm'
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

  const speciesLabels: Record<string, string> = {
    dog: 'Perro',
    cat: 'Gato',
    other: 'Otro',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🐾 OpenShelter
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 bg-gray-200 h-64 md:h-auto flex items-center justify-center">
                <span className="text-gray-400 text-lg">📷 Foto del animal</span>
              </div>
              <div className="md:w-1/2 p-8">
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
                      <span className="font-medium">Edad:</span> {animal.age} meses
                    </p>
                  )}
                  {animal.shelterName && (
                    <p className="text-gray-700">
                      <span className="font-medium">Refugio:</span> {animal.shelterName}
                    </p>
                  )}
                </div>
                {animal.description && (
                  <div className="mb-6">
                    <h2 className="font-bold text-gray-900 mb-2">Sobre {animal.name}</h2>
                    <p className="text-gray-700">{animal.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Adopción</h2>
            <AdoptionForm animalId={animal.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
