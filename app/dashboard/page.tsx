import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { animals, userRoles } from '@/lib/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import Link from 'next/link'
import { PlusCircle, List, Dog, CheckCircle, Home } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

  const stats = [
    {
      title: 'Total Animales',
      value: totalAnimals,
      icon: Dog,
      description: 'Animales registrados',
    },
    {
      title: 'Disponibles',
      value: availableAnimals,
      icon: CheckCircle,
      description: 'Listos para adopción',
      valueClass: 'text-green-600',
    },
    {
      title: 'Adoptados',
      value: adoptedAnimals,
      icon: CheckCircle,
      description: 'Encontraron un hogar',
      valueClass: 'text-blue-600',
    },
    {
      title: 'Refugios',
      value: totalShelters,
      icon: Home,
      description: 'Refugios asociados',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido de vuelta, {session.user?.name || 'Usuario'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.valueClass || ''}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Operaciones frecuentes para gestionar tu refugio
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/dashboard/animals/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Animal
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/animals">
              <List className="mr-2 h-4 w-4" />
              Ver Todos los Animales
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
