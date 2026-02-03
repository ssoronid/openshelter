import Link from 'next/link'
import { PawPrint, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <PawPrint className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <p className="text-xl text-muted-foreground">Página no encontrada</p>
        </div>

        <p className="text-muted-foreground max-w-md">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  )
}
