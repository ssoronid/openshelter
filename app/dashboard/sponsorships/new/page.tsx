import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SponsorshipForm from '@/components/sponsorships/SponsorshipForm'

export default async function NewSponsorshipPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Apadrinamiento</h1>
        <p className="text-muted-foreground">
          Registra un nuevo padrino para un animal
        </p>
      </div>

      <SponsorshipForm />
    </div>
  )
}


