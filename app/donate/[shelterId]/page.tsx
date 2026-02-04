import { db } from '@/lib/db'
import { shelters, animals } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DonationWidget from '@/components/donations/DonationWidget'

interface Props {
  params: Promise<{ shelterId: string }>
}

export default async function ShelterDonatePage({ params }: Props) {
  const { shelterId } = await params

  // Get shelter info
  const [shelter] = await db
    .select()
    .from(shelters)
    .where(and(eq(shelters.id, shelterId), eq(shelters.isActive, true)))
    .limit(1)

  if (!shelter) {
    notFound()
  }

  // Get available animals for this shelter
  const shelterAnimals = await db
    .select({
      id: animals.id,
      name: animals.name,
      species: animals.species,
    })
    .from(animals)
    .where(
      and(eq(animals.shelterId, shelterId), eq(animals.status, 'available'))
    )

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/donate"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ver todos los refugios
        </Link>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Heart className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Donar a {shelter.name}
            </h1>
            {shelter.city && (
              <p className="text-muted-foreground">{shelter.city}</p>
            )}
          </div>

          {/* Donation Widget */}
          <DonationWidget
            shelterId={shelter.id}
            shelterName={shelter.name}
            animals={shelterAnimals}
          />

          {/* Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Pagos procesados de forma segura por MercadoPago.
              <br />
              Tu donación va directamente al refugio seleccionado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


