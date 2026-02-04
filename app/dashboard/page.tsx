import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { animals, userRoles, adoptionApplications, shelters, donations, expenses } from '@/lib/db/schema'
import { eq, and, inArray, sql, desc, gte } from 'drizzle-orm'
import Link from 'next/link'
import { PlusCircle, List, Dog, CheckCircle, Home, Clock, HeartHandshake, Activity, Banknote, Receipt, TrendingUp } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  let inTreatmentAnimals = 0
  let totalShelters = 0
  let pendingApplications = 0
  let recentAnimals: any[] = []
  let recentApplications: any[] = []
  let monthlyDonations = 0
  let monthlyExpenses = 0
  let monthlyBalance = 0

  try {
    const userShelters = await db
      .select({ shelterId: userRoles.shelterId })
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id))

    shelterIds = userShelters.map((s) => s.shelterId)
    totalShelters = shelterIds.length

    if (shelterIds.length > 0) {
      // Animal counts
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

      const [inTreatment] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals)
        .where(
          and(
            eq(animals.status, 'in_treatment'),
            inArray(animals.shelterId, shelterIds)
          )
        )
      inTreatmentAnimals = inTreatment?.count || 0

      // Pending adoption applications
      const [pending] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(adoptionApplications)
        .innerJoin(animals, eq(adoptionApplications.animalId, animals.id))
        .where(
          and(
            eq(adoptionApplications.status, 'pending'),
            inArray(animals.shelterId, shelterIds)
          )
        )
      pendingApplications = pending?.count || 0

      // Recent animals
      recentAnimals = await db
        .select({
          id: animals.id,
          name: animals.name,
          species: animals.species,
          status: animals.status,
          createdAt: animals.createdAt,
        })
        .from(animals)
        .where(inArray(animals.shelterId, shelterIds))
        .orderBy(desc(animals.createdAt))
        .limit(5)

      // Recent applications
      recentApplications = await db
        .select({
          id: adoptionApplications.id,
          animalName: animals.name,
          applicantName: adoptionApplications.applicantName,
          status: adoptionApplications.status,
          createdAt: adoptionApplications.createdAt,
        })
        .from(adoptionApplications)
        .innerJoin(animals, eq(adoptionApplications.animalId, animals.id))
        .where(inArray(animals.shelterId, shelterIds))
        .orderBy(desc(adoptionApplications.createdAt))
        .limit(5)

      // Financial stats for this month
      const firstOfMonth = new Date()
      firstOfMonth.setDate(1)
      firstOfMonth.setHours(0, 0, 0, 0)
      const monthStart = firstOfMonth.toISOString().split('T')[0]

      const [donationsResult] = await db
        .select({
          sum: sql<string>`COALESCE(SUM(amount), 0)`,
        })
        .from(donations)
        .where(
          and(
            inArray(donations.shelterId, shelterIds),
            eq(donations.status, 'completed'),
            gte(donations.date, monthStart)
          )
        )
      monthlyDonations = parseFloat(donationsResult?.sum || '0')

      const [expensesResult] = await db
        .select({
          sum: sql<string>`COALESCE(SUM(amount), 0)`,
        })
        .from(expenses)
        .where(
          and(
            inArray(expenses.shelterId, shelterIds),
            gte(expenses.date, monthStart)
          )
        )
      monthlyExpenses = parseFloat(expensesResult?.sum || '0')
      monthlyBalance = monthlyDonations - monthlyExpenses
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const stats = [
    {
      title: 'Total Animales',
      value: totalAnimals,
      icon: Dog,
      description: 'Animales registrados',
      href: '/dashboard/animals',
    },
    {
      title: 'Disponibles',
      value: availableAnimals,
      icon: CheckCircle,
      description: 'Listos para adopción',
      valueClass: 'text-green-600',
      href: '/dashboard/animals?status=available',
    },
    {
      title: 'Adoptados',
      value: adoptedAnimals,
      icon: HeartHandshake,
      description: 'Encontraron un hogar',
      valueClass: 'text-blue-600',
      href: '/dashboard/animals?status=adopted',
    },
    {
      title: 'En Tratamiento',
      value: inTreatmentAnimals,
      icon: Activity,
      description: 'Recuperándose',
      valueClass: 'text-orange-600',
      href: '/dashboard/animals?status=in_treatment',
    },
    {
      title: 'Solicitudes Pendientes',
      value: pendingApplications,
      icon: Clock,
      description: 'Esperando revisión',
      valueClass: pendingApplications > 0 ? 'text-yellow-600' : '',
      href: '/dashboard/adoptions',
    },
    {
      title: 'Refugios',
      value: totalShelters,
      icon: Home,
      description: 'Refugios asociados',
      href: '/dashboard/shelters',
    },
  ]

  const financeStats = [
    {
      title: 'Donaciones del Mes',
      value: formatCurrency(monthlyDonations),
      icon: Banknote,
      description: 'Ingresos este mes',
      valueClass: 'text-green-600',
      href: '/dashboard/donations',
    },
    {
      title: 'Gastos del Mes',
      value: formatCurrency(monthlyExpenses),
      icon: Receipt,
      description: 'Egresos este mes',
      valueClass: 'text-red-600',
      href: '/dashboard/expenses',
    },
    {
      title: 'Balance del Mes',
      value: formatCurrency(monthlyBalance),
      icon: TrendingUp,
      description: monthlyBalance >= 0 ? 'Superávit' : 'Déficit',
      valueClass: monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600',
      href: '/dashboard/finances',
    },
  ]

  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    adopted: 'Adoptado',
    in_treatment: 'En tratamiento',
    deceased: 'Fallecido',
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  }

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    available: 'default',
    adopted: 'secondary',
    in_treatment: 'outline',
    pending: 'outline',
    approved: 'default',
    rejected: 'destructive',
  }

  const speciesLabels: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
    other: '🐾',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido de vuelta, {session.user?.name || 'Usuario'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
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
          </Link>
        ))}
      </div>

      {/* Finance Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Finanzas del Mes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {financeStats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
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
            </Link>
          ))}
        </div>
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
          {pendingApplications > 0 && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/adoptions">
                <Clock className="mr-2 h-4 w-4" />
                Revisar Solicitudes ({pendingApplications})
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Animals */}
        <Card>
          <CardHeader>
            <CardTitle>Animales Recientes</CardTitle>
            <CardDescription>Últimos animales registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnimals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay animales registrados</p>
            ) : (
              <div className="space-y-3">
                {recentAnimals.map((animal) => (
                  <Link
                    key={animal.id}
                    href={`/dashboard/animals/${animal.id}`}
                    className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{speciesLabels[animal.species] || '🐾'}</span>
                      <div>
                        <p className="font-medium">{animal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(animal.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariants[animal.status] || 'outline'}>
                      {statusLabels[animal.status] || animal.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes Recientes</CardTitle>
            <CardDescription>Últimas solicitudes de adopción</CardDescription>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay solicitudes de adopción</p>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <Link
                    key={app.id}
                    href="/dashboard/adoptions"
                    className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{app.applicantName}</p>
                      <p className="text-xs text-muted-foreground">
                        Para {app.animalName} · {new Date(app.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <Badge variant={statusVariants[app.status] || 'outline'}>
                      {statusLabels[app.status] || app.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
