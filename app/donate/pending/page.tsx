import Link from 'next/link'
import { Clock, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function DonationPendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-amber-600">
            Pago pendiente
          </CardTitle>
          <CardDescription className="text-base">
            Tu donación está siendo procesada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              El pago está pendiente de confirmación. Esto puede tomar unos
              minutos u horas dependiendo del método de pago seleccionado.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Recibirás un correo de MercadoPago cuando el pago sea confirmado.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 w-4 h-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



