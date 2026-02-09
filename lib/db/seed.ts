/**
 * Seed script for development
 * Run with: npm run db:seed
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users, shelters, animals, userRoles } from './schema'

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)
import { createId } from '@paralleldrive/cuid2'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Starting seed...')

  try {
    // Create a test shelter
    const [shelter] = await db
      .insert(shelters)
      .values({
        id: createId(),
        name: 'Refugio de Prueba',
        description: 'Refugio de ejemplo para desarrollo',
        email: 'refugio@example.com',
      })
      .returning()

    console.log('✅ Created shelter:', shelter.name)

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const [admin] = await db
      .insert(users)
      .values({
        id: createId(),
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
      })
      .returning()

    console.log('✅ Created admin user:', admin.email)

    // Assign admin role
    await db.insert(userRoles).values({
      id: createId(),
      userId: admin.id,
      shelterId: shelter.id,
      role: 'admin',
    })

    console.log('✅ Assigned admin role')

    // Create volunteer user
    const [volunteer] = await db
      .insert(users)
      .values({
        id: createId(),
        name: 'Volunteer User',
        email: 'volunteer@example.com',
        password: hashedPassword,
      })
      .returning()

    await db.insert(userRoles).values({
      id: createId(),
      userId: volunteer.id,
      shelterId: shelter.id,
      role: 'volunteer',
    })

    console.log('✅ Created volunteer user:', volunteer.email)

    // Create sample animals
    const sampleAnimals = [
      {
        id: createId(),
        shelterId: shelter.id,
        name: 'Max',
        species: 'dog' as const,
        breed: 'Labrador',
        age: 24,
        status: 'available' as const,
        description: 'Perro amigable y juguetón',
      },
      {
        id: createId(),
        shelterId: shelter.id,
        name: 'Luna',
        species: 'cat' as const,
        breed: 'Siamesa',
        age: 12,
        status: 'available' as const,
        description: 'Gata cariñosa y tranquila',
      },
    ]

    await db.insert(animals).values(sampleAnimals)
    console.log('✅ Created sample animals')

    console.log('🎉 Seed completed successfully!')
    console.log('\n📝 Test credentials:')
    console.log('  Admin: admin@example.com / admin123')
    console.log('  Volunteer: volunteer@example.com / admin123')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

seed()
  .then(async () => {
    await client.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error)
    await client.end()
    process.exit(1)
  })

