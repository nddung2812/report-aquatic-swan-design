import dotenv from 'dotenv'
import { Pool } from '@neondatabase/serverless'

dotenv.config()

const LINES: Array<{
  sort_order: number
  month_label: string
  visit_date: string
  status: 'done' | 'free_service' | 'not_yet' | 'soon'
}> = [
  { sort_order: 1, month_label: 'March', visit_date: '2026-03-18', status: 'done' },
  { sort_order: 2, month_label: 'June', visit_date: '2026-06-18', status: 'not_yet' },
  { sort_order: 3, month_label: 'September', visit_date: '2026-09-18', status: 'not_yet' },
  { sort_order: 4, month_label: 'December', visit_date: '2026-12-18', status: 'not_yet' },
]

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set')

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const name = 'Tabitha'
    const description = '27 Kelly Street, Eagleby 4207'
    const existing = await pool.query('SELECT id FROM service_customers WHERE name = $1', [name])
    let customerId: number

    if (existing.rows.length > 0) {
      customerId = existing.rows[0].id as number
      await pool.query(
        'DELETE FROM service_customer_schedule WHERE location_id IN (SELECT id FROM service_locations WHERE customer_id = $1)',
        [customerId]
      )
      await pool.query('DELETE FROM service_locations WHERE customer_id = $1', [customerId])
      console.log(`✓ Cleared locations for ${name} (id ${customerId})`)
    } else {
      const ins = await pool.query(
        `INSERT INTO service_customers (name, notes) VALUES ($1, $2) RETURNING id`,
        [name, '2026 quarterly visits']
      )
      customerId = ins.rows[0].id as number
      console.log(`✓ Inserted ${name} (id ${customerId})`)
    }

    const locIns = await pool.query(
      `INSERT INTO service_locations (customer_id, label, service_description, frequency, last_service, next_service, notes, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
       RETURNING id`,
      [
        customerId,
        'Primary',
        description,
        'Quarterly',
        '2026-03-18',
        '2026-06-18',
        '2026 quarterly visits',
      ]
    )
    const locationId = locIns.rows[0].id as number

    for (const line of LINES) {
      await pool.query(
        `INSERT INTO service_customer_schedule (location_id, sort_order, visit_date, month_label, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [locationId, line.sort_order, line.visit_date, line.month_label, line.status]
      )
    }
    console.log(`✓ Inserted ${LINES.length} schedule rows for ${name}`)
    await pool.end()
  } catch (error) {
    console.error('Seed failed:', error)
    await pool.end()
    process.exit(1)
  }
}

seed()
