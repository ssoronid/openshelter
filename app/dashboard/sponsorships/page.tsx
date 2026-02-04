import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { sponsorships, animals, userRoles } from '@/lib/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import Link from 'next/link'
import { PlusCircle, Users, Heart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import SponsorshipList from '@/components/sponsorships/SponsorshipList'

export default async function SponsorshipsPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  // Get user's shelters
  const userShelters = await db
    .select({ shelterId: userRoles.shelterId })
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id))

  const shelterIds = userShelters.map((s) => s.shelterId)

  let stats = {
    totalSponsorships: 0,
    activeSponsorships: 0,
    monthlyIncome: 0,
    sponsoredAnimals: 0,
  }

  if (shelterIds.length > 0) {
    // Get total sponsorships
    const [totalResult] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(sponsorships)
      .innerJoin(animals, eq(sponsorships.animalId, animals.id))
      .where(inArray(animals.shelterId, shelterIds))

    // Get active sponsorships and monthly income
    const [activeResult] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
        monthlySum: sql<string>`COALESCE(SUM(CASE WHEN frequency = 'monthly' THEN amount ELSE amount / 12 END), 0)`,
      })
      .from(sponsorships)
      .innerJoin(animals, eq(sponsorships.animalId, animals.id))
      .where(
        and(
          inArray(animals.shelterId, shelterIds),
          eq(sponsorships.isActive, 'true')
        )
      )

    // Get unique sponsored animals
    const [animalsResult] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${sponsorships.animalId})::int`,
      })
      .from(sponsorships)
      .innerJoin(animals, eq(sponsorships.animalId, animals.id))
      .where(
        and(
          inArray(animals.shelterId, shelterIds),
          eq(sponsorships.isActive, 'true')
        )
      )

    stats = {
      totalSponsorships: totalResult?.count || 0,
      activeSponsorships: activeResult?.count || 0,
      monthlyIncome: parseFloat(activeResult?.monthlySum || '0'),
      sponsoredAnimals: animalsResult?.count || 0,
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Total Apadrinamientos',
      value: stats.totalSponsorships.toString(),
      icon: Users,
      description: 'Registros totales',
      valueClass: '',
    },
    {
      title: 'Padrinos Activos',
      value: stats.activeSponsorships.toString(),
      icon: Heart,
      description: 'Actualmente activos',
      valueClass: 'text-green-600',
    },
    {
      title: 'Ingreso Mensual Estimado',
      value: formatAmount(stats.monthlyIncome),
      icon: TrendingUp,
      description: 'De apadrinamientos activos',
      valueClass: 'text-blue-600',
    },
    {
      title: 'Animales Apadrinados',
      value: stats.sponsoredAnimals.toString(),
      icon: Heart,
      description: 'Con padrinos activos',
      valueClass: 'text-purple-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apadrinamientos</h1>
          <p className="text-muted-foreground">
            Gestiona los padrinos de los animales del refugio
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sponsorships/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Apadrinamiento
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.valueClass}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SponsorshipList />
    </div>
  )
}


