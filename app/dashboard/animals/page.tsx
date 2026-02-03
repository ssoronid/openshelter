import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnimalList from '@/components/animals/AnimalList'

export default async function AnimalsPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Animales</h1>
        <Link
          href="/dashboard/animals/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Nuevo Animal
        </Link>
      </div>
      <AnimalList />
    </div>
  )
}
