import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { shelters, userRoles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import UsersPageClient from './UsersPageClient'

interface Props {
  searchParams: Promise<{ shelterId?: string }>
}

export default async function UsersPage({ searchParams }: Props) {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  const { shelterId: selectedShelterId } = await searchParams

  // Get user's shelters with roles
  const userShelters = await db
    .select({
      id: shelters.id,
      name: shelters.name,
      role: userRoles.role,
    })
    .from(shelters)
    .innerJoin(userRoles, eq(shelters.id, userRoles.shelterId))
    .where(eq(userRoles.userId, session.user.id))

  if (userShelters.length === 0) {
    redirect('/dashboard/shelters')
  }

  // Use selected shelter or first available
  const currentShelterId = selectedShelterId && userShelters.some(s => s.id === selectedShelterId)
    ? selectedShelterId
    : userShelters[0].id

  const currentShelter = userShelters.find(s => s.id === currentShelterId)
  const isAdmin = currentShelter?.role === 'admin'

  return (
    <UsersPageClient
      shelters={userShelters}
      currentShelterId={currentShelterId}
      currentUserId={session.user.id}
      isAdmin={isAdmin}
    />
  )
}
