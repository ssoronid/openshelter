import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnimalList from '@/components/animals/AnimalList'

export default async function AnimalsPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Animales</h1>
        <a
          href="/dashboard/animals/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Nuevo Animal
        </a>
      </div>
      <AnimalList />
    </div>
  )
}

