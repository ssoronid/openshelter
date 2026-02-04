import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { animals, animalPhotos, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { uploadFile, deleteFile, validateImageFile } from '@/lib/storage/blob'

const addPhotoSchema = z.object({
  url: z.string().url(),
  isPrimary: z.boolean().optional(),
})

// GET /api/animals/[id]/photos - List photos for an animal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: animalId } = await params

    const photos = await db
      .select()
      .from(animalPhotos)
      .where(eq(animalPhotos.animalId, animalId))
      .orderBy(animalPhotos.isPrimary)

    return NextResponse.json({ data: photos })
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Error al obtener fotos' },
      { status: 500 }
    )
  }
}

// POST /api/animals/[id]/photos - Add photo to animal (supports file upload or URL)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: animalId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get animal to verify access
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
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
        { error: 'No tienes acceso a este animal' },
        { status: 403 }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let url: string
    let isPrimary = false

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      isPrimary = formData.get('isPrimary') === 'true'

      if (!file) {
        return NextResponse.json(
          { error: 'No se proporcionó ningún archivo' },
          { status: 400 }
        )
      }

      // Validate file
      try {
        validateImageFile(file, 5)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Archivo inválido' },
          { status: 400 }
        )
      }

      // Upload to Vercel Blob
      const timestamp = Date.now()
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `animals/${animalId}/${timestamp}.${extension}`

      url = await uploadFile(file, filename, {
        contentType: file.type,
      })
    } else {
      // Handle JSON with URL
      const body = await request.json()
      const validated = addPhotoSchema.parse(body)
      url = validated.url
      isPrimary = validated.isPrimary || false
    }

    // If setting as primary, unset other primary photos
    if (isPrimary) {
      await db
        .update(animalPhotos)
        .set({ isPrimary: false })
        .where(eq(animalPhotos.animalId, animalId))
    }

    // Check if this is the first photo
    const existingPhotos = await db
      .select()
      .from(animalPhotos)
      .where(eq(animalPhotos.animalId, animalId))

    // First photo is always primary
    if (existingPhotos.length === 0) {
      isPrimary = true
    }

    // Add photo record
    const [newPhoto] = await db
      .insert(animalPhotos)
      .values({
        animalId,
        url,
        isPrimary,
      })
      .returning()

    return NextResponse.json({ data: newPhoto }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding photo:', error)
    return NextResponse.json(
      { error: 'Error al agregar foto' },
      { status: 500 }
    )
  }
}

// DELETE /api/animals/[id]/photos - Delete a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: animalId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId es requerido' },
        { status: 400 }
      )
    }

    // Get animal to verify access
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
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
        { error: 'No tienes acceso a este animal' },
        { status: 403 }
      )
    }

    // Get photo
    const [photo] = await db
      .select()
      .from(animalPhotos)
      .where(
        and(
          eq(animalPhotos.id, photoId),
          eq(animalPhotos.animalId, animalId)
        )
      )
      .limit(1)

    if (!photo) {
      return NextResponse.json(
        { error: 'Foto no encontrada' },
        { status: 404 }
      )
    }

    // Delete from blob storage
    try {
      await deleteFile(photo.url)
    } catch (error) {
      console.warn('Error deleting file from blob storage:', error)
    }

    // Delete from database
    await db.delete(animalPhotos).where(eq(animalPhotos.id, photoId))

    // If deleted photo was primary, set another as primary
    if (photo.isPrimary) {
      const [nextPhoto] = await db
        .select()
        .from(animalPhotos)
        .where(eq(animalPhotos.animalId, animalId))
        .limit(1)

      if (nextPhoto) {
        await db
          .update(animalPhotos)
          .set({ isPrimary: true })
          .where(eq(animalPhotos.id, nextPhoto.id))
      }
    }

    return NextResponse.json({ message: 'Foto eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Error al eliminar foto' },
      { status: 500 }
    )
  }
}

// PATCH /api/animals/[id]/photos - Set primary photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: animalId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const photoId = body.photoId

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId es requerido' },
        { status: 400 }
      )
    }

    // Get animal to verify access
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
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
        { error: 'No tienes acceso a este animal' },
        { status: 403 }
      )
    }

    // Unset all primary photos
    await db
      .update(animalPhotos)
      .set({ isPrimary: false })
      .where(eq(animalPhotos.animalId, animalId))

    // Set new primary
    const [updatedPhoto] = await db
      .update(animalPhotos)
      .set({ isPrimary: true })
      .where(
        and(
          eq(animalPhotos.id, photoId),
          eq(animalPhotos.animalId, animalId)
        )
      )
      .returning()

    if (!updatedPhoto) {
      return NextResponse.json(
        { error: 'Foto no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updatedPhoto })
  } catch (error) {
    console.error('Error setting primary photo:', error)
    return NextResponse.json(
      { error: 'Error al establecer foto principal' },
      { status: 500 }
    )
  }
}


