import Link from 'next/link'
import { CheckCircle, Heart, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function DonationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600">
            ¡Gracias por tu donación!
          </CardTitle>
          <CardDescription className="text-base">
            Tu generosidad hace la diferencia en la vida de los animales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Tu pago ha sido procesado exitosamente. Recibirás un correo de
              confirmación de MercadoPago.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm">
              Los animales te lo agradecen
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/donate">
                Hacer otra donación
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



