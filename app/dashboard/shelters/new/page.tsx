import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { userRoles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import ShelterForm from '@/components/shelters/ShelterForm'

export default async function NewShelterPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  // Check if user is admin of any shelter
  const adminRoles = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id))

  const isAdminOfAnyShelter = adminRoles.some((role) => role.role === 'admin')

  if (!isAdminOfAnyShelter) {
    redirect('/dashboard/shelters')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Refugio</h1>
        <p className="text-muted-foreground">
          Crea un nuevo refugio para gestionar animales
        </p>
      </div>

      <ShelterForm />
    </div>
  )
}

