import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DonationForm from '@/components/donations/DonationForm'

export default async function NewDonationPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nueva Donación</h1>
        <p className="text-muted-foreground">
          Registra una donación recibida manualmente
        </p>
      </div>

      <DonationForm />
    </div>
  )
}



