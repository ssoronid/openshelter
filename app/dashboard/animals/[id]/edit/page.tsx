import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AnimalForm from '@/components/animals/AnimalForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAnimalPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/animals/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Animal</h1>
          <p className="text-muted-foreground">
            Modifica la información del animal
          </p>
        </div>
      </div>

      <AnimalForm animalId={id} />
    </div>
  )
}
