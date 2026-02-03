import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let cachedDb: ReturnType<typeof drizzle> | null = null

const getDb = () => {
  if (!cachedDb) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set')
    }

    const client = postgres(databaseUrl, { max: 1 })
    cachedDb = drizzle(client, { schema })
  }

  return cachedDb
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as Record<string, unknown>)[prop as string]
  },
})


