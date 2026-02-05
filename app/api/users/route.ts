import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  shelterId: z.string().min(1, 'El refugio es requerido'),
  role: z.enum(['admin', 'volunteer', 'viewer']).default('volunteer'),
})

// GET /api/users - List users in shelters user has access to
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const shelterId = searchParams.get('shelterId')

    if (!shelterId) {
      return NextResponse.json(
        { error: 'shelterId es requerido' },
        { status: 400 }
      )
    }

    // Verify user has access to this shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este refugio' },
        { status: 403 }
      )
    }

    const usersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: userRoles.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .where(eq(userRoles.shelterId, shelterId))

    return NextResponse.json({ data: usersList })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createUserSchema.parse(body)

    // Verify user is admin of the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, validated.shelterId),
          eq(userRoles.role, 'admin')
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear usuarios' },
        { status: 403 }
      )
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
      })
      .returning()

    // Assign role
    await db.insert(userRoles).values({
      userId: newUser.id,
      shelterId: validated.shelterId,
      role: validated.role,
    })

    return NextResponse.json(
      {
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: validated.role,
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

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}




