import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function UsersPage() {
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los usuarios y sus permisos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Usuarios
          </CardTitle>
          <CardDescription>
            Esta funcionalidad estará disponible próximamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí podrás agregar nuevos usuarios, asignar roles y administrar los
            permisos de acceso al sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
