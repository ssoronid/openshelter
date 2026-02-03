import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AnimalList from '@/components/animals/AnimalList'

export default async function AnimalsPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Animales</h1>
          <p className="text-muted-foreground">
            Gestiona los animales de tus refugios
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/animals/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Animal
          </Link>
        </Button>
      </div>

      <AnimalList />
    </div>
  )
}
