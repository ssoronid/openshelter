import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnimalForm from '@/components/animals/AnimalForm'

export default async function NewAnimalPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nuevo Animal</h1>
      <AnimalForm />
    </div>
  )
}
