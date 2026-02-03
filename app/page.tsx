import Link from 'next/link'
import { db } from '@/lib/db'
import { animals, animalPhotos, shelters, users } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { PawPrint, Heart, Users, Building2, ArrowRight, Dog, Cat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getStats() {
  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)

  // If no users, system needs setup
  if (userCount.count === 0) {
    return { needsSetup: true }
  }

  const [animalCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(animals)
    .where(eq(animals.status, 'available'))

  const [adoptedCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(animals)
    .where(eq(animals.status, 'adopted'))

  const [shelterCount] = await db
    .select({ count: sql<number>`count(distinct ${shelters.id})::int` })
    .from(shelters)

  return {
    needsSetup: false,
    available: animalCount.count,
    adopted: adoptedCount.count,
    shelters: shelterCount.count,
  }
}

async function getFeaturedAnimals() {
  const animalsList = await db
    .select({
      id: animals.id,
      name: animals.name,
      species: animals.species,
      breed: animals.breed,
      age: animals.age,
      shelterName: shelters.name,
    })
    .from(animals)
    .leftJoin(shelters, eq(animals.shelterId, shelters.id))
    .where(eq(animals.status, 'available'))
    .orderBy(desc(animals.createdAt))
    .limit(4)

  // Get photos
  const animalIds = animalsList.map((a) => a.id)
  const photos = await db
    .select({
      animalId: animalPhotos.animalId,
      url: animalPhotos.url,
    })
    .from(animalPhotos)
    .where(eq(animalPhotos.isPrimary, true))

  const photosMap = photos.reduce((acc, photo) => {
    if (animalIds.includes(photo.animalId)) {
      acc[photo.animalId] = photo.url
    }
    return acc
  }, {} as Record<string, string>)

  return animalsList.map((animal) => ({
    ...animal,
    primaryPhoto: photosMap[animal.id] || null,
  }))
}

export default async function Home() {
  const stats = await getStats()
  const featuredAnimals = stats.needsSetup ? [] : await getFeaturedAnimals()

  const speciesLabels: Record<string, string> = {
    dog: 'Perro',
    cat: 'Gato',
    other: 'Otro',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PawPrint className="h-6 w-6 text-primary" />
              OpenShelter
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/animals"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Ver animales
              </Link>
              {stats.needsSetup ? (
                <Button asChild>
                  <Link href="/setup">Configurar Sistema</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/signin">Iniciar sesión</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Encuentra a tu nuevo
            <span className="text-primary"> mejor amigo</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            OpenShelter conecta refugios de animales con personas que buscan dar
            un hogar lleno de amor. Cada adopción cambia dos vidas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/animals">
                <Heart className="mr-2 h-5 w-5" />
                Ver animales en adopción
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={stats.needsSetup ? '/setup' : '/signin'}>
                <Building2 className="mr-2 h-5 w-5" />
                Soy un refugio
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      {!stats.needsSetup && (
        <section className="py-12 bg-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.available}
                </div>
                <div className="text-gray-600">Animales esperando un hogar</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {stats.adopted}
                </div>
                <div className="text-gray-600">Adopciones exitosas</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stats.shelters}
                </div>
                <div className="text-gray-600">Refugios participantes</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Animals */}
      {featuredAnimals.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Animales en adopción
                </h2>
                <p className="text-gray-600">
                  Conoce a algunos de nuestros amigos que buscan un hogar
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/animals">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredAnimals.map((animal) => {
                const SpeciesIcon = animal.species === 'cat' ? Cat : Dog
                return (
                  <Link key={animal.id} href={`/animals/${animal.id}`}>
                    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 h-full">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        {animal.primaryPhoto ? (
                          <img
                            src={animal.primaryPhoto}
                            alt={animal.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <SpeciesIcon className="h-16 w-16 text-primary/30" />
                          </div>
                        )}
                        <Badge className="absolute top-3 left-3" variant="secondary">
                          {speciesLabels[animal.species] || animal.species}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {animal.name}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {animal.breed && <p>{animal.breed}</p>}
                          {animal.age && (
                            <p>
                              {animal.age < 12
                                ? `${animal.age} meses`
                                : `${Math.floor(animal.age / 12)} año${Math.floor(animal.age / 12) > 1 ? 's' : ''}`}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA for shelters */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Tienes un refugio de animales?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            OpenShelter es un sistema gratuito y open-source para gestionar tu
            refugio. Registra animales, gestiona adopciones y conecta con
            potenciales adoptantes.
          </p>
          <Button size="lg" asChild>
            <Link href={stats.needsSetup ? '/setup' : '/signin'}>
              <Building2 className="mr-2 h-5 w-5" />
              {stats.needsSetup ? 'Configurar ahora' : 'Acceder al sistema'}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p className="mb-2">
            © {new Date().getFullYear()} OpenShelter. Sistema open-source para
            refugios de animales.
          </p>
          <p>
            <a
              href="https://github.com/ssoronid/openshelter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>
            {' · '}
            <Link href="/animals" className="text-primary hover:underline">
              Ver animales
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
