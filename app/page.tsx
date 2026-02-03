import Link from 'next/link'
import { PawPrint, ArrowRight, Shield, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-8 md:p-24">
        <div className="z-10 max-w-4xl w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary p-4">
              <PawPrint className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              OpenShelter
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Sistema open-source para gestión de refugios de animales en
              Latinoamérica
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signin">
                Iniciar Sesión
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t bg-card">
        <div className="container mx-auto px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <PawPrint className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Gestión de Animales</h3>
              <p className="text-muted-foreground text-sm">
                Registra y administra todos los animales del refugio con
                información detallada.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Adopciones</h3>
              <p className="text-muted-foreground text-sm">
                Sistema de solicitudes de adopción con seguimiento y
                notificaciones.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Open Source</h3>
              <p className="text-muted-foreground text-sm">
                100% código abierto. Contribuye y adapta el sistema a tus
                necesidades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
