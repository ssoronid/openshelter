import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { animals, shelters, animalPhotos } from '@/lib/db/schema'
import { eq, and, or, like, desc, sql } from 'drizzle-orm'

// GET /api/public/animals - List available animals (public, no auth required)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const species = searchParams.get('species')
    const shelterId = searchParams.get('shelterId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    // Build where conditions - only available animals
    const conditions = [eq(animals.status, 'available')]

    if (species && species !== 'all') {
      conditions.push(eq(animals.species, species as any))
    }

    if (shelterId) {
      conditions.push(eq(animals.shelterId, shelterId))
    }

    if (search) {
      conditions.push(
        or(
          like(animals.name, `%${search}%`),
          like(animals.breed || '', `%${search}%`),
          like(animals.description || '', `%${search}%`)
        )!
      )
    }

    const whereClause = and(...conditions)

    // Get animals with shelter info
    const animalsList = await db
      .select({
        id: animals.id,
        name: animals.name,
        species: animals.species,
        breed: animals.breed,
        age: animals.age,
        description: animals.description,
        shelterId: animals.shelterId,
        shelterName: shelters.name,
        createdAt: animals.createdAt,
      })
      .from(animals)
      .leftJoin(shelters, eq(animals.shelterId, shelters.id))
      .where(whereClause)
      .orderBy(desc(animals.createdAt))
      .limit(limit)
      .offset(offset)

    // Get primary photos for each animal
    const animalIds = animalsList.map((a) => a.id)
    let photosMap: Record<string, string> = {}

    if (animalIds.length > 0) {
      const photos = await db
        .select({
          animalId: animalPhotos.animalId,
          url: animalPhotos.url,
          isPrimary: animalPhotos.isPrimary,
        })
        .from(animalPhotos)
        .where(eq(animalPhotos.isPrimary, true))

      photosMap = photos.reduce((acc, photo) => {
        if (animalIds.includes(photo.animalId)) {
          acc[photo.animalId] = photo.url
        }
        return acc
      }, {} as Record<string, string>)
    }

    // Combine animals with their primary photos
    const animalsWithPhotos = animalsList.map((animal) => ({
      ...animal,
      primaryPhoto: photosMap[animal.id] || null,
    }))

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(animals)
      .where(whereClause)

    const total = totalResult?.count || 0

    // Get available shelters for filter
    const sheltersList = await db
      .selectDistinct({
        id: shelters.id,
        name: shelters.name,
      })
      .from(animals)
      .innerJoin(shelters, eq(animals.shelterId, shelters.id))
      .where(eq(animals.status, 'available'))

    return NextResponse.json({
      data: animalsWithPhotos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        shelters: sheltersList,
      },
    })
  } catch (error) {
    console.error('Error fetching public animals:', error)
    return NextResponse.json(
      { error: 'Error al obtener animales' },
      { status: 500 }
    )
  }
}


