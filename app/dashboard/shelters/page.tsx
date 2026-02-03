import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Home } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function SheltersPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Refugios</h1>
        <p className="text-muted-foreground">
          Gestiona los refugios asociados a tu cuenta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Gestión de Refugios
          </CardTitle>
          <CardDescription>
            Esta funcionalidad estará disponible próximamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí podrás agregar, editar y administrar los refugios de animales
            que gestionas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
