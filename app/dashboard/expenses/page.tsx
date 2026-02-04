import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { expenses, userRoles } from '@/lib/db/schema'
import { eq, and, inArray, sql, gte } from 'drizzle-orm'
import Link from 'next/link'
import { PlusCircle, Receipt, Calendar, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import ExpenseList from '@/components/expenses/ExpenseList'

export default async function ExpensesPage() {
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
    totalAmount: 0,
    totalCount: 0,
    thisMonthAmount: 0,
    thisMonthCount: 0,
  }

  if (shelterIds.length > 0) {
    // Get total expenses
    const [totalResult] = await db
      .select({
        sum: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(expenses)
      .where(inArray(expenses.shelterId, shelterIds))

    // Get this month's expenses
    const firstOfMonth = new Date()
    firstOfMonth.setDate(1)
    firstOfMonth.setHours(0, 0, 0, 0)

    const [monthResult] = await db
      .select({
        sum: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(expenses)
      .where(
        and(
          inArray(expenses.shelterId, shelterIds),
          gte(expenses.date, firstOfMonth.toISOString().split('T')[0])
        )
      )

    stats = {
      totalAmount: parseFloat(totalResult?.sum || '0'),
      totalCount: totalResult?.count || 0,
      thisMonthAmount: parseFloat(monthResult?.sum || '0'),
      thisMonthCount: monthResult?.count || 0,
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
      title: 'Total Gastos',
      value: formatAmount(stats.totalAmount),
      icon: Receipt,
      description: `${stats.totalCount} registros`,
      valueClass: 'text-red-600',
    },
    {
      title: 'Este Mes',
      value: formatAmount(stats.thisMonthAmount),
      icon: Calendar,
      description: `${stats.thisMonthCount} gastos`,
      valueClass: 'text-orange-600',
    },
    {
      title: 'Promedio por Gasto',
      value: stats.totalCount > 0
        ? formatAmount(stats.totalAmount / stats.totalCount)
        : formatAmount(0),
      icon: TrendingDown,
      description: 'Monto promedio',
      valueClass: '',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">
            Gestiona los gastos y egresos de tu refugio
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/expenses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Gasto
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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

      <ExpenseList />
    </div>
  )
}


