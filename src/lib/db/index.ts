import postgres from 'postgres'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

let database: PostgresJsDatabase<typeof schema> | undefined
let client: ReturnType<typeof postgres> | undefined

export function getDatabase() {
  if (database) return database
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not configured')
  client = postgres(connectionString, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  database = drizzle(client, { schema })
  return database
}