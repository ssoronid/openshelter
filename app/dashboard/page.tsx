import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { animals, userRoles } from '@/lib/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  // Get user's shelters
  let shelterIds: string[] = []
  let totalAnimals = 0
  let availableAnimals = 0
  let adoptedAnimals = 0
  let totalShelters = 0

  try {
    const userShelters = await db
      .select({ shelterId: userRoles.shelterId })
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id))

    shelterIds = userShelters.map((s) => s.shelterId)
    totalShelters = shelterIds.length

    if (shelterIds.length > 0) {
      const [total] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals)
        .where(inArray(animals.shelterId, shelterIds))
      totalAnimals = total?.count || 0

      const [available] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals)
        .where(
          and(
            eq(animals.status, 'available'),
            inArray(animals.shelterId, shelterIds)
          )
        )
      availableAnimals = available?.count || 0

      const [adopted] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals)
        .where(
          and(
            eq(animals.status, 'adopted'),
            inArray(animals.shelterId, shelterIds)
          )
        )
      adoptedAnimals = adopted?.count || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 mb-2">
            Total Animales
          </h2>
          <p className="text-3xl font-bold text-gray-900">{totalAnimals}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 mb-2">
            Disponibles
          </h2>
          <p className="text-3xl font-bold text-green-600">{availableAnimals}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Adoptados</h2>
          <p className="text-3xl font-bold text-blue-600">{adoptedAnimals}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Refugios</h2>
          <p className="text-3xl font-bold text-gray-900">{totalShelters}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="flex gap-4">
          <Link
            href="/dashboard/animals/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Nuevo Animal
          </Link>
          <Link
            href="/dashboard/animals"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            📋 Ver Todos los Animales
          </Link>
        </div>
      </div>
    </div>
  )
}
