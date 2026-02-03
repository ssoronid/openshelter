const postgres = require('postgres')
require('dotenv').config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL || 'postgresql://openshelter:openshelter@localhost:5433/openshelter'

console.log('Testing connection with:', connectionString.replace(/:[^:@]+@/, ':****@'))

const sql = postgres(connectionString, { max: 1 })

async function test() {
  try {
    const result = await sql`SELECT 1 as test`
    console.log('✅ Connection successful!', result)
    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Full error:', error)
    await sql.end()
    process.exit(1)
  }
}

test()

