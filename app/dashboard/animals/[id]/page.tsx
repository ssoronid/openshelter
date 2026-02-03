import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { animals, shelters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function AnimalDetailPage({ params }: Props) {
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
    .where(eq(animals.id, params.id))
    .limit(1)

  if (!animal) {
    notFound()
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

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    adopted: 'bg-blue-100 text-blue-800',
    in_treatment: 'bg-yellow-100 text-yellow-800',
    deceased: 'bg-gray-100 text-gray-800',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{animal.name}</h1>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/animals/${animal.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ✏️ Editar
          </Link>
          <Link
            href="/dashboard/animals"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Especie</label>
            <p className="text-lg text-gray-900">{speciesLabels[animal.species] || animal.species}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Raza</label>
            <p className="text-lg text-gray-900">{animal.breed || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Edad</label>
            <p className="text-lg text-gray-900">
              {animal.age ? `${animal.age} meses` : '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Estado</label>
            <p className="text-lg">
              <span className={`px-3 py-1 text-sm rounded-full ${statusColors[animal.status] || 'bg-gray-100'}`}>
                {statusLabels[animal.status] || animal.status}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Refugio</label>
            <p className="text-lg text-gray-900">{animal.shelterName || '-'}</p>
          </div>
        </div>

        {animal.description && (
          <div>
            <label className="text-sm font-medium text-gray-500">Descripción</label>
            <p className="text-lg text-gray-900 mt-1">{animal.description}</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>Creado: {new Date(animal.createdAt).toLocaleDateString('es-ES')}</p>
          <p>Actualizado: {new Date(animal.updatedAt).toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
  )
}
