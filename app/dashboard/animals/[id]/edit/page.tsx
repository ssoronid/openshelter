import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnimalForm from '@/components/animals/AnimalForm'

interface Props {
  params: { id: string }
}

export default async function EditAnimalPage({ params }: Props) {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Editar Animal</h1>
      <AnimalForm animalId={params.id} />
    </div>
  )
}
