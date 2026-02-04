import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { adoptionApplications, animals, userRoles, shelters, notifications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { sendEmail, generateApplicationApprovedEmail, generateApplicationRejectedEmail } from '@/lib/email'

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
})

// PATCH /api/adoptions/[id]/approve - Approve or reject application
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = reviewSchema.parse(body)

    // Get application
    const [application] = await db
      .select()
      .from(adoptionApplications)
      .where(eq(adoptionApplications.id, id))
      .limit(1)

    if (!application) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Get animal to check shelter access
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, application.animalId))
      .limit(1)

    if (!animal) {
      return NextResponse.json(
        { error: 'Animal no encontrado' },
        { status: 404 }
      )
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, animal.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta solicitud' },
        { status: 403 }
      )
    }

    // Update application
    const [updatedApplication] = await db
      .update(adoptionApplications)
      .set({
        status: validated.status,
        notes: validated.notes || application.notes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adoptionApplications.id, id))
      .returning()

    // If approved, update animal status
    if (validated.status === 'approved') {
      await db
        .update(animals)
        .set({
          status: 'adopted',
          updatedAt: new Date(),
        })
        .where(eq(animals.id, animal.id))
    }

    // Get shelter info for email
    const [shelter] = await db
      .select()
      .from(shelters)
      .where(eq(shelters.id, animal.shelterId))
      .limit(1)

    // Create notification for the reviewing user
    await db.insert(notifications).values({
      userId: session.user.id,
      shelterId: animal.shelterId,
      type: validated.status === 'approved' ? 'application_approved' : 'application_rejected',
      title: validated.status === 'approved' ? 'Adopción aprobada' : 'Solicitud rechazada',
      message: `La solicitud de ${application.applicantName} para ${animal.name} fue ${validated.status === 'approved' ? 'aprobada' : 'rechazada'}`,
      link: '/dashboard/adoptions',
    })

    // Send email to applicant
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    if (validated.status === 'approved') {
      await sendEmail({
        to: application.applicantEmail,
        subject: `¡Tu solicitud de adopción fue aprobada! - ${animal.name}`,
        html: generateApplicationApprovedEmail({
          applicantName: application.applicantName,
          animalName: animal.name,
          animalSpecies: animal.species,
          shelterName: shelter?.name || 'El refugio',
          shelterEmail: shelter?.email || undefined,
          shelterPhone: shelter?.phone || undefined,
          notes: validated.notes,
        }),
      })
    } else {
      await sendEmail({
        to: application.applicantEmail,
        subject: `Actualización sobre tu solicitud de adopción - ${animal.name}`,
        html: generateApplicationRejectedEmail({
          applicantName: application.applicantName,
          animalName: animal.name,
          shelterName: shelter?.name || 'El refugio',
          notes: validated.notes,
          websiteUrl: `${baseUrl}/animals`,
        }),
      })
    }

    return NextResponse.json({ data: updatedApplication })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error reviewing application:', error)
    return NextResponse.json(
      { error: 'Error al revisar solicitud' },
      { status: 500 }
    )
  }
}

