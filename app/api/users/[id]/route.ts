import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'volunteer', 'viewer']),
  shelterId: z.string().min(1),
})

// PATCH /api/users/[id] - Update user role in a shelter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateRoleSchema.parse(body)

    // Verify current user is admin of this shelter
    const [currentUserRole] = await db
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

    if (!currentUserRole) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden cambiar roles' },
        { status: 403 }
      )
    }

    // Prevent user from demoting themselves if they're the only admin
    if (targetUserId === session.user.id && validated.role !== 'admin') {
      const adminCount = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.shelterId, validated.shelterId),
            eq(userRoles.role, 'admin')
          )
        )

      if (adminCount.length === 1) {
        return NextResponse.json(
          { error: 'No puedes quitarte el rol de admin si eres el único administrador' },
          { status: 400 }
        )
      }
    }

    // Update user role
    const [updatedRole] = await db
      .update(userRoles)
      .set({
        role: validated.role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.shelterId, validated.shelterId)
        )
      )
      .returning()

    if (!updatedRole) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en este refugio' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updatedRole })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Error al actualizar rol' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Remove user from shelter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
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

    // Verify current user is admin of this shelter
    const [currentUserRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, shelterId),
          eq(userRoles.role, 'admin')
        )
      )
      .limit(1)

    if (!currentUserRole) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar usuarios' },
        { status: 403 }
      )
    }

    // Prevent deleting yourself if you're the only admin
    if (targetUserId === session.user.id) {
      const adminCount = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.shelterId, shelterId),
            eq(userRoles.role, 'admin')
          )
        )

      if (adminCount.length === 1) {
        return NextResponse.json(
          { error: 'No puedes eliminarte si eres el único administrador' },
          { status: 400 }
        )
      }
    }

    // Remove user from shelter
    await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.shelterId, shelterId)
        )
      )

    return NextResponse.json({ message: 'Usuario eliminado del refugio' })
  } catch (error) {
    console.error('Error removing user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}



