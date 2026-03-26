import dotenv from 'dotenv'
import { Pool } from '@neondatabase/serverless'

dotenv.config()

const DESCRIPTION = '68 High Street Mt Gravatt'

const LINES: Array<{
  sort_order: number
  month_label: string
  visit_date: string
  status: 'done' | 'free_service' | 'not_yet' | 'soon'
}> = [
  { sort_order: 1, month_label: 'January', visit_date: '2026-01-13', status: 'done' },
  { sort_order: 2, month_label: 'February', visit_date: '2026-02-13', status: 'done' },
  { sort_order: 3, month_label: 'March', visit_date: '2026-03-13', status: 'done' },
  { sort_order: 4, month_label: 'April', visit_date: '2026-04-13', status: 'not_yet' },
  { sort_order: 5, month_label: 'May', visit_date: '2026-05-13', status: 'not_yet' },
  { sort_order: 6, month_label: 'June', visit_date: '2026-06-13', status: 'not_yet' },
  { sort_order: 7, month_label: 'July', visit_date: '2026-07-13', status: 'not_yet' },
  { sort_order: 8, month_label: 'August', visit_date: '2026-08-13', status: 'not_yet' },
  { sort_order: 9, month_label: 'September', visit_date: '2026-09-13', status: 'not_yet' },
  { sort_order: 10, month_label: 'October', visit_date: '2026-10-13', status: 'not_yet' },
  { sort_order: 11, month_label: 'November', visit_date: '2026-11-13', status: 'not_yet' },
  { sort_order: 12, month_label: 'December', visit_date: '2026-12-13', status: 'not_yet' },
]

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set')

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const name = 'Con'
    const existing = await pool.query('SELECT id FROM service_customers WHERE name = $1', [name])
    let customerId: number

    if (existing.rows.length > 0) {
      customerId = existing.rows[0].id as number
      await pool.query(
        'DELETE FROM service_customer_schedule WHERE location_id IN (SELECT id FROM service_locations WHERE customer_id = $1)',
        [customerId]
      )
      await pool.query('DELETE FROM service_locations WHERE customer_id = $1', [customerId])
      await pool.query(`UPDATE service_customers SET notes = $2 WHERE id = $1`, [customerId, '2026 monthly schedule'])
      console.log(`✓ Updated ${name} (id ${customerId})`)
    } else {
      const ins = await pool.query(
        `INSERT INTO service_customers (name, notes) VALUES ($1, $2) RETURNING id`,
        [name, '2026 monthly schedule']
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
        DESCRIPTION,
        'Monthly',
        '2026-03-13',
        '2026-04-13',
        '2026 monthly schedule',
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
