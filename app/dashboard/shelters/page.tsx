import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SheltersPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Refugios</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <p className="text-gray-500">Gestión de refugios (próximamente)</p>
      </div>
    </div>
  )
}
