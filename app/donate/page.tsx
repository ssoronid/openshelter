import { db } from '@/lib/db'
import { shelters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { Heart, Building2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DonatePage() {
  // Get all active shelters
  const allShelters = await db
    .select({
      id: shelters.id,
      name: shelters.name,
      address: shelters.address,
      city: shelters.city,
    })
    .from(shelters)
    .where(eq(shelters.isActive, true))

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <Heart className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Haz una Donación
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tu donación ayuda a mantener a los animales del refugio alimentados,
            sanos y con un techo. Cada contribución marca la diferencia.
          </p>
        </div>

        {/* Shelter Selection */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Selecciona un refugio para donar
          </h2>

          {allShelters.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  No hay refugios disponibles en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allShelters.map((shelter) => (
                <Link key={shelter.id} href={`/donate/${shelter.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-amber-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <Building2 className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{shelter.name}</CardTitle>
                          {shelter.city && (
                            <CardDescription>{shelter.city}</CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {shelter.address && (
                        <p className="text-sm text-muted-foreground">
                          {shelter.address}
                        </p>
                      )}
                      <Button className="w-full mt-4" variant="outline">
                        Donar a este refugio
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h3 className="text-lg font-semibold mb-4">¿Cómo ayuda tu donación?</h3>
          <div className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg bg-white shadow-sm">
              <p className="font-medium text-foreground">Alimentación</p>
              <p>Comida de calidad para todos los animales</p>
            </div>
            <div className="p-4 rounded-lg bg-white shadow-sm">
              <p className="font-medium text-foreground">Salud</p>
              <p>Vacunas, medicamentos y atención veterinaria</p>
            </div>
            <div className="p-4 rounded-lg bg-white shadow-sm">
              <p className="font-medium text-foreground">Refugio</p>
              <p>Mantenimiento y mejoras de las instalaciones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


