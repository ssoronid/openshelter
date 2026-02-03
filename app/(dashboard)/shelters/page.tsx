import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SheltersPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Refugios</h1>
      <p>Gestión de refugios (próximamente)</p>
    </div>
  )
}

