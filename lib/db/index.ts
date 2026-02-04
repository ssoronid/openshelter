import 'server-only'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

// For build time when no DB is available, create a null client
// Use prepare: false for serverless compatibility with Neon pooler
const client = connectionString
  ? postgres(connectionString, { prepare: false })
  : null

export const db = client ? drizzle(client, { schema }) : null!
