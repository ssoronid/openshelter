import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userRoles, shelters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/me/roles - Get all shelter-scoped roles for the authenticated user
export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const roles = await db
            .select({
                shelterId: userRoles.shelterId,
                shelterName: shelters.name,
                role: userRoles.role,
            })
            .from(userRoles)
            .innerJoin(shelters, eq(userRoles.shelterId, shelters.id))
            .where(eq(userRoles.userId, session.user.id))

        return NextResponse.json({
            data: roles,
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
            },
        })
    } catch (error) {
        console.error('Error fetching user roles:', error)
        return NextResponse.json(
            { error: 'Error al obtener roles' },
            { status: 500 }
        )
    }
}

