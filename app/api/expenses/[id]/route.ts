import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses, userRoles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateExpenseSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  amount: z.string().or(z.number()).transform((v) => String(v)).optional(),
  currency: z.string().optional(),
  date: z.string().optional(),
  receipt: z.string().optional(),
})

// GET /api/expenses/[id] - Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1)

    if (!expense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, expense.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este gasto' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: expense })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Error al obtener gasto' },
      { status: 500 }
    )
  }
}

// PATCH /api/expenses/[id] - Update expense
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
    const validated = updateExpenseSchema.parse(body)

    // Get expense first to check permissions
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1)

    if (!expense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    // Verify user has access to the shelter
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, expense.shelterId)
        )
      )
      .limit(1)

    if (!userRole) {
      return NextResponse.json(
        { error: 'No tienes acceso a este gasto' },
        { status: 403 }
      )
    }

    const [updatedExpense] = await db
      .update(expenses)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning()

    return NextResponse.json({ data: updatedExpense })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Error al actualizar gasto' },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get expense first to check permissions
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1)

    if (!expense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    // Verify user has access and is admin
    const [userRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.shelterId, expense.shelterId)
        )
      )
      .limit(1)

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar gastos' },
        { status: 403 }
      )
    }

    await db.delete(expenses).where(eq(expenses.id, id))

    return NextResponse.json({ message: 'Gasto eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    )
  }
}



