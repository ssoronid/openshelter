import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdoptionList from '@/components/adoptions/AdoptionList'

export default async function AdoptionsPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Solicitudes de Adopción
        </h1>
        <p className="text-muted-foreground">
          Revisa y gestiona las solicitudes de adopción
        </p>
      </div>

      <AdoptionList />
    </div>
  )
}
