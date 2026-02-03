import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnimalForm from '@/components/animals/AnimalForm'

export default async function EditAnimalPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Animal</h1>
      <AnimalForm animalId={params.id} />
    </div>
  )
}

