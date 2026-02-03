import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdoptionList from '@/components/adoptions/AdoptionList'

export default async function AdoptionsPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Solicitudes de Adopción</h1>
      <AdoptionList />
    </div>
  )
}
