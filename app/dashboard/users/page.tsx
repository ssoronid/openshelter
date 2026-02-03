import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Usuarios</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <p className="text-gray-500">Gestión de usuarios (próximamente)</p>
      </div>
    </div>
  )
}
