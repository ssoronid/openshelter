import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { donations, expenses, sponsorships, animals, userRoles } from '@/lib/db/schema'
import { eq, and, inArray, sql, gte, desc } from 'drizzle-orm'
import Link from 'next/link'
import {
  Banknote,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Users,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function FinancesPage() {
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

  // Initialize stats
  let stats = {
    totalDonations: 0,
    totalExpenses: 0,
    thisMonthDonations: 0,
    thisMonthExpenses: 0,
    lastMonthDonations: 0,
    lastMonthExpenses: 0,
    activeSponsorships: 0,
    monthlyRecurring: 0,
  }

  let recentDonations: any[] = []
  let recentExpenses: any[] = []
  let topCategories: { category: string; total: number }[] = []

  if (shelterIds.length > 0) {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthStart = firstOfMonth.toISOString().split('T')[0]
    const lastMonthStart = firstOfLastMonth.toISOString().split('T')[0]

    // Total donations (all time)
    const [totalDonationsResult] = await db
      .select({
        sum: sql<string>`COALESCE(SUM(amount), 0)`,
      })
      .from(donations)
      .where(
        and(
          inArray(donations.shelterId, shelterIds),
          eq(donations.status, 'completed')
        )
      )
    stats.totalDonations = parseFloat(totalDonationsResult?.sum || '0')

    // Total expenses (all time)
    const [totalExpensesResult] = await db
      .select({
        sum: sql<string>`COALESCE(SUM(amount), 0)`,
      })
      .from(expenses)
      .where(inArray(expenses.shelterId, shelterIds))
    stats.totalExpenses = parseFloat(totalExpensesResult?.sum || '0')

    // This month donations
    const [thisMonthDonationsResult] = await db
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
    stats.thisMonthDonations = parseFloat(thisMonthDonationsResult?.sum || '0')

    // This month expenses
    const [thisMonthExpensesResult] = await db
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
    stats.thisMonthExpenses = parseFloat(thisMonthExpensesResult?.sum || '0')

    // Last month donations
    const [lastMonthDonationsResult] = await db
      .select({
        sum: sql<string>`COALESCE(SUM(amount), 0)`,
      })
      .from(donations)
      .where(
        and(
          inArray(donations.shelterId, shelterIds),
          eq(donations.status, 'completed'),
          gte(donations.date, lastMonthStart),
          sql`${donations.date} < ${monthStart}`
        )
      )
    stats.lastMonthDonations = parseFloat(lastMonthDonationsResult?.sum || '0')

    // Last month expenses
    const [lastMonthExpensesResult] = await db
      .select({
        sum: sql<string>`COALESCE(SUM(amount), 0)`,
      })
      .from(expenses)
      .where(
        and(
          inArray(expenses.shelterId, shelterIds),
          gte(expenses.date, lastMonthStart),
          sql`${expenses.date} < ${monthStart}`
        )
      )
    stats.lastMonthExpenses = parseFloat(lastMonthExpensesResult?.sum || '0')

    // Active sponsorships and monthly recurring
    const [sponsorshipsResult] = await db
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
    stats.activeSponsorships = sponsorshipsResult?.count || 0
    stats.monthlyRecurring = parseFloat(sponsorshipsResult?.monthlySum || '0')

    // Recent donations
    recentDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        donorName: donations.donorName,
        date: donations.date,
        status: donations.status,
        paymentMethod: donations.paymentMethod,
      })
      .from(donations)
      .where(
        and(
          inArray(donations.shelterId, shelterIds),
          eq(donations.status, 'completed')
        )
      )
      .orderBy(desc(donations.date))
      .limit(5)

    // Recent expenses
    recentExpenses = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        description: expenses.description,
        category: expenses.category,
        date: expenses.date,
      })
      .from(expenses)
      .where(inArray(expenses.shelterId, shelterIds))
      .orderBy(desc(expenses.date))
      .limit(5)

    // Top expense categories
    const categoriesResult = await db
      .select({
        category: expenses.category,
        total: sql<string>`SUM(amount)`,
      })
      .from(expenses)
      .where(inArray(expenses.shelterId, shelterIds))
      .groupBy(expenses.category)
      .orderBy(sql`SUM(amount) DESC`)
      .limit(5)

    topCategories = categoriesResult.map((c) => ({
      category: c.category,
      total: parseFloat(c.total || '0'),
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const balance = stats.totalDonations - stats.totalExpenses
  const monthlyBalance = stats.thisMonthDonations - stats.thisMonthExpenses
  const donationChange = stats.lastMonthDonations > 0
    ? ((stats.thisMonthDonations - stats.lastMonthDonations) / stats.lastMonthDonations) * 100
    : 0
  const expenseChange = stats.lastMonthExpenses > 0
    ? ((stats.thisMonthExpenses - stats.lastMonthExpenses) / stats.lastMonthExpenses) * 100
    : 0

  const categoryLabels: Record<string, string> = {
    food: 'Alimentación',
    medical: 'Médico/Veterinario',
    shelter: 'Mantenimiento',
    supplies: 'Suministros',
    transport: 'Transporte',
    utilities: 'Servicios',
    salary: 'Salarios',
    other: 'Otro',
  }

  const paymentMethodLabels: Record<string, string> = {
    mercadopago: 'MercadoPago',
    pix: 'PIX',
    paypal: 'PayPal',
    bank_transfer: 'Transferencia',
    cash: 'Efectivo',
    other: 'Otro',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-muted-foreground">
          Resumen financiero de tu refugio
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Balance Total
            </CardTitle>
            {balance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Donaciones - Gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Donaciones del Mes
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.thisMonthDonations)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {donationChange !== 0 && (
                <>
                  {donationChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={donationChange > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(donationChange).toFixed(0)}%
                  </span>
                  <span className="ml-1">vs mes anterior</span>
                </>
              )}
              {donationChange === 0 && <span>vs mes anterior</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos del Mes
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.thisMonthExpenses)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {expenseChange !== 0 && (
                <>
                  {expenseChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-red-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-green-600 mr-1" />
                  )}
                  <span className={expenseChange > 0 ? 'text-red-600' : 'text-green-600'}>
                    {Math.abs(expenseChange).toFixed(0)}%
                  </span>
                  <span className="ml-1">vs mes anterior</span>
                </>
              )}
              {expenseChange === 0 && <span>vs mes anterior</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Recurrentes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.monthlyRecurring)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSponsorships} apadrinamientos activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance del Mes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Balance del Mes Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-green-50">
              <p className="text-sm text-green-800 mb-1">Ingresos</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.thisMonthDonations)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50">
              <p className="text-sm text-red-800 mb-1">Egresos</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.thisMonthExpenses)}
              </p>
            </div>
            <div className={`text-center p-4 rounded-lg ${monthlyBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className={`text-sm mb-1 ${monthlyBalance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                Balance
              </p>
              <p className={`text-2xl font-bold ${monthlyBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(monthlyBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Donations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Donaciones Recientes</CardTitle>
              <CardDescription>Últimas donaciones recibidas</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/donations">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay donaciones</p>
            ) : (
              <div className="space-y-3">
                {recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-green-600">
                        +{formatCurrency(parseFloat(donation.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {donation.donorName || 'Anónimo'} ·{' '}
                        {paymentMethodLabels[donation.paymentMethod] || donation.paymentMethod}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(donation.date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gastos Recientes</CardTitle>
              <CardDescription>Últimos gastos registrados</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/expenses">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay gastos</p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-red-600">
                        -{formatCurrency(parseFloat(expense.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {expense.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[expense.category] || expense.category}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Expense Categories */}
      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Principales Categorías de Gastos</CardTitle>
            <CardDescription>Distribución de gastos por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((cat, index) => {
                const percentage = (cat.total / stats.totalExpenses) * 100
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {categoryLabels[cat.category] || cat.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(cat.total)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/dashboard/donations/new">
              Registrar Donación
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/expenses/new">
              Registrar Gasto
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/sponsorships/new">
              Nuevo Apadrinamiento
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}



