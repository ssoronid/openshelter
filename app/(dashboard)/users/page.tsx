import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Usuarios</h1>
      <p>Gestión de usuarios (próximamente)</p>
    </div>
  )
}

