import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications, userRoles } from '@/lib/db/schema'
import { eq, desc, and, inArray, sql } from 'drizzle-orm'

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get user's shelters
    const userShelters = await db
      .select({ shelterId: userRoles.shelterId })
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id))

    const shelterIds = userShelters.map((s) => s.shelterId)

    // Build conditions
    const conditions = [
      eq(notifications.userId, session.user.id),
    ]

    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false))
    }

    // Get notifications
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)

    // Get unread count
    const [{ count: unreadCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.isRead, false)
        )
      )

    return NextResponse.json({
      data: userNotifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}

// POST /api/notifications/mark-all-read - Mark all as read
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.isRead, false)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Error al marcar notificaciones' },
      { status: 500 }
    )
  }
}



