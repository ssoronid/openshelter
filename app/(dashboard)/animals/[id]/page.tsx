import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { animals, shelters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function AnimalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
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
    .where(eq(animals.id, params.id))
    .limit(1)

  if (!animal) {
    notFound()
  }

  const statusLabels = {
    available: 'Disponible',
    adopted: 'Adoptado',
    in_treatment: 'En tratamiento',
    deceased: 'Fallecido',
  }

  const speciesLabels = {
    dog: 'Perro',
    cat: 'Gato',
    other: 'Otro',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{animal.name}</h1>
        <div className="flex gap-2">
          <a
            href={`/dashboard/animals/${animal.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Editar
          </a>
          <a
            href="/dashboard/animals"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Volver
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Especie</label>
            <p className="text-lg">{speciesLabels[animal.species]}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Raza</label>
            <p className="text-lg">{animal.breed || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Edad</label>
            <p className="text-lg">
              {animal.age ? `${animal.age} meses` : '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Estado</label>
            <p className="text-lg">
              <span
                className={`px-2 py-1 text-sm rounded ${
                  animal.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : animal.status === 'adopted'
                    ? 'bg-blue-100 text-blue-800'
                    : animal.status === 'in_treatment'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {statusLabels[animal.status]}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Refugio</label>
            <p className="text-lg">{animal.shelterName || '-'}</p>
          </div>
        </div>

        {animal.description && (
          <div>
            <label className="text-sm font-medium text-gray-500">
              Descripción
            </label>
            <p className="text-lg mt-1">{animal.description}</p>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            Creado: {new Date(animal.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            Actualizado: {new Date(animal.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

