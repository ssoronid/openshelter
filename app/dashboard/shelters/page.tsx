import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { userRoles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ShelterList from '@/components/shelters/ShelterList'

export default async function SheltersPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  // Check if user is admin of any shelter (can create new shelters)
  const adminRoles = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id))

  const isAdminOfAnyShelter = adminRoles.some((role) => role.role === 'admin')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refugios</h1>
          <p className="text-muted-foreground">
            Gestiona los refugios asociados a tu cuenta
          </p>
        </div>
        {isAdminOfAnyShelter && (
          <Button asChild>
            <Link href="/dashboard/shelters/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Refugio
            </Link>
          </Button>
        )}
      </div>

      <ShelterList />
    </div>
  )
}
