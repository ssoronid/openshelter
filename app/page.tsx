import Link from 'next/link'
import { db } from '@/lib/db'
import { animals, animalPhotos, shelters, users } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { PawPrint, Heart, Users, Building2, ArrowRight, Dog, Cat, Sparkles, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Force dynamic rendering - page needs database access
export const dynamic = 'force-dynamic'

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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-orange-300/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-foreground flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-xl">
                  <PawPrint className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="hidden sm:inline">
                Open<span className="text-gradient">Shelter</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/animals"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Ver animales
              </Link>
              {stats.needsSetup ? (
                <Button asChild className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25">
                  <Link href="/setup">Configurar Sistema</Link>
                </Button>
              ) : (
                <Button asChild className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25">
                  <Link href="/signin">Iniciar sesión</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-bounce-slow">
                <Sparkles className="h-4 w-4" />
                Adopta con amor
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight">
                Encuentra a tu nuevo
                <span className="text-gradient block mt-2">mejor amigo</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
                OpenShelter conecta refugios de animales con personas que buscan dar
                un hogar lleno de amor. <span className="text-primary font-semibold">Cada adopción cambia dos vidas.</span>
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/30 text-lg h-14 px-8">
                  <Link href="/animals">
                    <Heart className="mr-2 h-5 w-5" />
                    Ver animales en adopción
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-lg h-14 px-8">
                  <Link href={stats.needsSetup ? '/setup' : '/signin'}>
                    <Building2 className="mr-2 h-5 w-5" />
                    Soy un refugio
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Hero Image / Illustration */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-[3rem] blur-3xl opacity-20 animate-pulse-soft" />
              <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-[3rem] p-8 border border-orange-100">
                <div className="grid grid-cols-2 gap-4">
                  {/* Pet cards illustration */}
                  <div className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100 animate-float">
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-4">
                      <Dog className="h-16 w-16 text-orange-400" />
                    </div>
                    <div className="h-3 bg-orange-200 rounded-full w-3/4 mb-2" />
                    <div className="h-2 bg-orange-100 rounded-full w-1/2" />
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100 animate-float-delayed mt-8">
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4">
                      <Cat className="h-16 w-16 text-amber-500" />
                    </div>
                    <div className="h-3 bg-amber-200 rounded-full w-3/4 mb-2" />
                    <div className="h-2 bg-amber-100 rounded-full w-1/2" />
                  </div>
                  <div className="col-span-2 bg-white rounded-2xl p-6 shadow-xl shadow-orange-100">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center">
                        <Heart className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-orange-200 rounded-full w-3/4 mb-2" />
                        <div className="h-2 bg-orange-100 rounded-full w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-3xl p-8 shadow-lg shadow-orange-100 border border-orange-50 hover:shadow-xl hover:shadow-orange-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">100% Gratuito</h3>
              <p className="text-muted-foreground">
                OpenShelter es completamente gratuito y open-source. Sin costos ocultos ni suscripciones.
              </p>
            </div>
            <div className="group bg-white rounded-3xl p-8 shadow-lg shadow-orange-100 border border-orange-50 hover:shadow-xl hover:shadow-orange-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Fácil de usar</h3>
              <p className="text-muted-foreground">
                Interfaz intuitiva diseñada para que cualquier refugio pueda gestionar sus animales fácilmente.
              </p>
            </div>
            <div className="group bg-white rounded-3xl p-8 shadow-lg shadow-orange-100 border border-orange-50 hover:shadow-xl hover:shadow-orange-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Conecta comunidades</h3>
              <p className="text-muted-foreground">
                Une refugios con adoptantes y crea una red de apoyo para los animales que lo necesitan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {!stats.needsSetup && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 rounded-[2.5rem] p-1">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 rounded-[2.5rem] blur-xl opacity-50" />
              <div className="relative bg-white rounded-[2.25rem] p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div className="group">
                    <div className="text-5xl sm:text-6xl font-extrabold text-gradient mb-3 group-hover:scale-110 transition-transform">
                      {stats.available}
                    </div>
                    <div className="text-muted-foreground font-medium">Animales esperando un hogar</div>
                  </div>
                  <div className="group">
                    <div className="text-5xl sm:text-6xl font-extrabold text-green-600 mb-3 group-hover:scale-110 transition-transform">
                      {stats.adopted}
                    </div>
                    <div className="text-muted-foreground font-medium">Adopciones exitosas</div>
                  </div>
                  <div className="group">
                    <div className="text-5xl sm:text-6xl font-extrabold text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                      {stats.shelters}
                    </div>
                    <div className="text-muted-foreground font-medium">Refugios participantes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Animals */}
      {featuredAnimals.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <PawPrint className="h-4 w-4" />
                  Listos para adoptar
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
                  Animales en adopción
                </h2>
                <p className="text-xl text-muted-foreground">
                  Conoce a algunos de nuestros amigos que buscan un hogar
                </p>
              </div>
              <Button variant="outline" asChild className="border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 shrink-0">
                <Link href="/animals">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredAnimals.map((animal, index) => {
                const SpeciesIcon = animal.species === 'cat' ? Cat : Dog
                return (
                  <Link key={animal.id} href={`/animals/${animal.id}`}>
                    <Card 
                      className="overflow-hidden group hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-500 h-full border-0 bg-white rounded-3xl"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
                        {animal.primaryPhoto ? (
                          <img
                            src={animal.primaryPhoto}
                            alt={animal.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full blur-xl opacity-30" />
                              <SpeciesIcon className="relative h-20 w-20 text-orange-300" />
                            </div>
                          </div>
                        )}
                        <Badge className="absolute top-4 left-4 bg-white/90 text-foreground border-0 shadow-lg">
                          {speciesLabels[animal.species] || animal.species}
                        </Badge>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {animal.name}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {animal.breed && <p className="font-medium">{animal.breed}</p>}
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-[3rem] p-12 sm:p-16">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-10 left-10 opacity-10">
              <PawPrint className="h-32 w-32 text-white" />
            </div>
            <div className="absolute bottom-10 right-10 opacity-10">
              <Heart className="h-24 w-24 text-white" />
            </div>
            
            <div className="relative text-center">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                ¿Tienes un refugio de animales?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                OpenShelter es un sistema gratuito y open-source para gestionar tu
                refugio. Registra animales, gestiona adopciones y conecta con
                potenciales adoptantes.
              </p>
              <Button size="lg" asChild className="bg-white text-orange-600 hover:bg-white/90 shadow-xl text-lg h-14 px-10 font-semibold">
                <Link href={stats.needsSetup ? '/setup' : '/signin'}>
                  <Building2 className="mr-2 h-5 w-5" />
                  {stats.needsSetup ? 'Configurar ahora' : 'Acceder al sistema'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-100 py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-orange-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-xl">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-foreground">OpenShelter</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} OpenShelter. Sistema open-source para refugios de animales.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="https://github.com/ssoronid/openshelter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                GitHub
              </a>
              <Link href="/animals" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Ver animales
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
