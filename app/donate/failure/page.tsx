import Link from 'next/link'
import { XCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function DonationFailurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">
            Pago no completado
          </CardTitle>
          <CardDescription className="text-base">
            Hubo un problema al procesar tu donación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              El pago fue rechazado o cancelado. No se realizó ningún cargo a tu
              cuenta.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Posibles razones:</p>
            <ul className="mt-2 space-y-1 text-left list-disc list-inside">
              <li>Fondos insuficientes</li>
              <li>Tarjeta rechazada por el banco</li>
              <li>Pago cancelado por el usuario</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/donate">
                <RefreshCw className="mr-2 w-4 h-4" />
                Intentar de nuevo
              </Link>
            </Button>
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


