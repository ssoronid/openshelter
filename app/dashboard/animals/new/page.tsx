import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AnimalForm from '@/components/animals/AnimalForm'

export default async function NewAnimalPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/animals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Animal</h1>
          <p className="text-muted-foreground">
            Registra un nuevo animal en el sistema
          </p>
        </div>
      </div>

      <AnimalForm />
    </div>
  )
}
