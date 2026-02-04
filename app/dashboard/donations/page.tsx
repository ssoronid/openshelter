import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { donations, userRoles } from '@/lib/db/schema'
import { eq, and, inArray, sql, gte } from 'drizzle-orm'
import Link from 'next/link'
import { PlusCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DonationList from '@/components/donations/DonationList'
import DonationStats from '@/components/donations/DonationStats'

export default async function DonationsPage() {
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
        currency: 'ARS',
    }

    if (shelterIds.length > 0) {
        // Get total donations
        const [totalResult] = await db
            .select({
                sum: sql<string>`COALESCE(SUM(amount), 0)`,
                count: sql<number>`COUNT(*)::int`,
            })
            .from(donations)
            .where(
                and(
                    inArray(donations.shelterId, shelterIds),
                    eq(donations.status, 'completed')
                )
            )

        // Get this month's donations
        const firstOfMonth = new Date()
        firstOfMonth.setDate(1)
        firstOfMonth.setHours(0, 0, 0, 0)

        const [monthResult] = await db
            .select({
                sum: sql<string>`COALESCE(SUM(amount), 0)`,
                count: sql<number>`COUNT(*)::int`,
            })
            .from(donations)
            .where(
                and(
                    inArray(donations.shelterId, shelterIds),
                    eq(donations.status, 'completed'),
                    gte(donations.date, firstOfMonth.toISOString().split('T')[0])
                )
            )

        stats = {
            totalAmount: parseFloat(totalResult?.sum || '0'),
            totalCount: totalResult?.count || 0,
            thisMonthAmount: parseFloat(monthResult?.sum || '0'),
            thisMonthCount: monthResult?.count || 0,
            currency: 'ARS',
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Donaciones</h1>
                    <p className="text-muted-foreground">
                        Gestiona las donaciones recibidas por tu refugio
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/donate" target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Página Pública
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/donations/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Registrar Donación
                        </Link>
                    </Button>
                </div>
            </div>

            <DonationStats stats={stats} />

            <DonationList />
        </div>
    )
}

