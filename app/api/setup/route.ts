import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, shelters, userRoles } from '@/lib/db/schema'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'

const setupSchema = z.object({
  // Admin data
  adminName: z.string().min(1, 'El nombre es requerido'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  // Shelter data
  shelterName: z.string().min(1, 'El nombre del refugio es requerido'),
  shelterDescription: z.string().optional(),
  shelterAddress: z.string().optional(),
  shelterPhone: z.string().optional(),
  shelterEmail: z.string().email().optional().or(z.literal('')),
  shelterWebsite: z.string().url().optional().or(z.literal('')),
})

// GET /api/setup - Check if setup is needed
export async function GET() {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)

    const needsSetup = result.count === 0

    return NextResponse.json({ needsSetup })
  } catch (error) {
    console.error('Error checking setup status:', error)
    return NextResponse.json(
      { error: 'Error al verificar estado del sistema' },
      { status: 500 }
    )
  }
}

// POST /api/setup - Create initial admin and shelter
export async function POST(request: NextRequest) {
  try {
    // Check if setup is already done
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)

    if (result.count > 0) {
      return NextResponse.json(
        { error: 'El sistema ya está configurado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = setupSchema.parse(body)

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.adminPassword, 10)

    // Create shelter first
    const [newShelter] = await db
      .insert(shelters)
      .values({
        name: validated.shelterName,
        description: validated.shelterDescription || null,
        address: validated.shelterAddress || null,
        phone: validated.shelterPhone || null,
        email: validated.shelterEmail || null,
        website: validated.shelterWebsite || null,
      })
      .returning()

    // Create admin user
    const [newUser] = await db
      .insert(users)
      .values({
        name: validated.adminName,
        email: validated.adminEmail,
        password: hashedPassword,
      })
      .returning()

    // Assign admin role
    await db.insert(userRoles).values({
      userId: newUser.id,
      shelterId: newShelter.id,
      role: 'admin',
    })

    return NextResponse.json(
      {
        message: 'Sistema configurado correctamente',
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
          },
          shelter: {
            id: newShelter.id,
            name: newShelter.name,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error during setup:', error)
    return NextResponse.json(
      { error: 'Error al configurar el sistema' },
      { status: 500 }
    )
  }
}


