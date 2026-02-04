import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { shelters, userRoles, animals } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import Link from 'next/link'
import { Building2, MapPin, Phone, Mail, Globe, Edit, Users, Dog, ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ShelterDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session) {
    redirect('/signin')
  }

  // Get shelter with user's role
  const [userRole] = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, session.user.id),
        eq(userRoles.shelterId, id)
      )
    )
    .limit(1)

  if (!userRole) {
    redirect('/dashboard/shelters')
  }

  const [shelter] = await db
    .select()
    .from(shelters)
    .where(eq(shelters.id, id))
    .limit(1)

  if (!shelter) {
    notFound()
  }

  // Get animal stats
  const [animalStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      available: sql<number>`count(*) filter (where ${animals.status} = 'available')::int`,
      adopted: sql<number>`count(*) filter (where ${animals.status} = 'adopted')::int`,
      inTreatment: sql<number>`count(*) filter (where ${animals.status} = 'in_treatment')::int`,
    })
    .from(animals)
    .where(eq(animals.shelterId, id))

  // Get user count
  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userRoles)
    .where(eq(userRoles.shelterId, id))

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    volunteer: 'Voluntario',
    viewer: 'Visualizador',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/shelters">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{shelter.name}</h1>
            <Badge variant="outline">{roleLabels[userRole.role]}</Badge>
          </div>
          {shelter.description && (
            <p className="text-muted-foreground">{shelter.description}</p>
          )}
        </div>
        {userRole.role === 'admin' && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/shelters/${id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/shelters/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animales</CardTitle>
            <Dog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{animalStats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Dog className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{animalStats?.available || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adoptados</CardTitle>
            <Dog className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{animalStats?.adopted || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount?.count || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {shelter.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Dirección</div>
                <div className="text-muted-foreground">{shelter.address}</div>
              </div>
            </div>
          )}
          {shelter.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Teléfono</div>
                <div className="text-muted-foreground">{shelter.phone}</div>
              </div>
            </div>
          )}
          {shelter.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Email</div>
                <a href={`mailto:${shelter.email}`} className="text-primary hover:underline">
                  {shelter.email}
                </a>
              </div>
            </div>
          )}
          {shelter.website && (
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Sitio Web</div>
                <a href={shelter.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {shelter.website}
                </a>
              </div>
            </div>
          )}
          {!shelter.address && !shelter.phone && !shelter.email && !shelter.website && (
            <p className="text-muted-foreground col-span-2">
              No hay información de contacto registrada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede a las funciones principales del refugio</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href={`/dashboard/animals?shelterId=${id}`}>
              <Dog className="mr-2 h-4 w-4" />
              Ver Animales
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/animals/new?shelterId=${id}`}>
              Agregar Animal
            </Link>
          </Button>
          {userRole.role === 'admin' && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/users?shelterId=${id}`}>
                <Users className="mr-2 h-4 w-4" />
                Gestionar Usuarios
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

