import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { animals, userRoles } from '@/lib/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  // Get user's shelters
  const userShelters = await db
    .select({ shelterId: userRoles.shelterId })
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id))

  const shelterIds = userShelters.map((s) => s.shelterId)

  // Get stats
  let totalAnimals = { count: 0 }
  let availableAnimals = { count: 0 }
  let adoptedAnimals = { count: 0 }

  if (shelterIds.length > 0) {
    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(animals)
      .where(inArray(animals.shelterId, shelterIds))
    totalAnimals = total || { count: 0 }

    const [available] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(animals)
      .where(
        and(
          eq(animals.status, 'available'),
          inArray(animals.shelterId, shelterIds)
        )
      )
    availableAnimals = available || { count: 0 }

    const [adopted] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(animals)
      .where(
        and(
          eq(animals.status, 'adopted'),
          inArray(animals.shelterId, shelterIds)
        )
      )
    adoptedAnimals = adopted || { count: 0 }
  }

  const totalShelters = userShelters.length

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">
            Total Animales
          </h2>
          <p className="text-3xl font-bold">{Number(totalAnimals?.count || 0)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">
            Disponibles
          </h2>
          <p className="text-3xl font-bold text-green-600">
            {Number(availableAnimals?.count || 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Adoptados</h2>
          <p className="text-3xl font-bold text-blue-600">
            {Number(adoptedAnimals?.count || 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Refugios</h2>
          <p className="text-3xl font-bold">{totalShelters}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
        <div className="flex gap-4">
          <a
            href="/dashboard/animals/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Nuevo Animal
          </a>
          <a
            href="/dashboard/animals"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Ver Todos los Animales
          </a>
        </div>
      </div>
    </div>
  )
}
