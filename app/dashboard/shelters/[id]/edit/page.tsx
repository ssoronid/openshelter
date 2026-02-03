import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import ShelterForm from '@/components/shelters/ShelterForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditShelterPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  // Verify user is admin of this shelter
  const [userRole] = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, session.user.id),
        eq(userRoles.shelterId, id),
        eq(userRoles.role, 'admin')
      )
    )
    .limit(1)

  if (!userRole) {
    redirect('/dashboard/shelters')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Refugio</h1>
        <p className="text-muted-foreground">
          Modifica la información del refugio
        </p>
      </div>

      <ShelterForm shelterId={id} />
    </div>
  )
}

