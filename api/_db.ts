import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    pool = new Pool({ connectionString: databaseUrl })
  }
  return pool
}

export async function query(sql: string, params?: unknown[]) {
  const p = getPool()
  return p.query(sql, params)
}
