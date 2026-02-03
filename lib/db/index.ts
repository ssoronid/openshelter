import 'server-only'

import { neon } from '@neondatabase/serverless'
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Lazy initialization to avoid build-time errors when env vars are not set
let _db: NeonHttpDatabase<typeof schema> | null = null

function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db
  
  // Neon integration uses POSTGRES_URL, fallback to DATABASE_URL for local dev
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'Database connection string not found. ' +
      'Expected POSTGRES_URL (Vercel/Neon) or DATABASE_URL (local dev).'
    )
  }
  
  const sql = neon(connectionString)
  _db = drizzle(sql, { schema })
  return _db
}

// Export a proxy that lazily initializes the database connection
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const realDb = getDb()
    const value = (realDb as any)[prop]
    if (typeof value === 'function') {
      return value.bind(realDb)
    }
    return value
  },
})
