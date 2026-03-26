import dotenv from 'dotenv'
import { Pool } from '@neondatabase/serverless'

dotenv.config()

const LINES: Array<{
  sort_order: number
  month_label: string
  visit_date: string
  status: 'done' | 'free_service' | 'not_yet' | 'soon'
}> = [
  { sort_order: 1, month_label: 'January', visit_date: '2026-01-30', status: 'done' },
  { sort_order: 2, month_label: 'February', visit_date: '2026-02-27', status: 'done' },
  { sort_order: 3, month_label: 'March', visit_date: '2026-03-31', status: 'not_yet' },
  { sort_order: 4, month_label: 'April', visit_date: '2026-04-30', status: 'not_yet' },
  { sort_order: 5, month_label: 'May', visit_date: '2026-05-29', status: 'not_yet' },
  { sort_order: 6, month_label: 'June', visit_date: '2026-06-30', status: 'not_yet' },
  { sort_order: 7, month_label: 'July', visit_date: '2026-07-31', status: 'not_yet' },
  { sort_order: 8, month_label: 'August', visit_date: '2026-08-31', status: 'not_yet' },
  { sort_order: 9, month_label: 'September', visit_date: '2026-09-30', status: 'not_yet' },
  { sort_order: 10, month_label: 'October', visit_date: '2026-10-30', status: 'not_yet' },
  { sort_order: 11, month_label: 'November', visit_date: '2026-11-30', status: 'not_yet' },
  { sort_order: 12, month_label: 'December', visit_date: '2026-12-23', status: 'free_service' },
]

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set')

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const name = 'Hanako Kasako'
    const existing = await pool.query('SELECT id FROM service_customers WHERE name = $1', [name])
    let customerId: number

    if (existing.rows.length > 0) {
      customerId = existing.rows[0].id as number
      await pool.query('DELETE FROM service_customer_schedule WHERE customer_id = $1', [customerId])
      await pool.query(
        `UPDATE service_customers
         SET service_description = $2, frequency = $3, last_service = $4, next_service = $5, notes = $6
         WHERE id = $1`,
        [
          customerId,
          'Sunnybank',
          'Monthly',
          '2026-02-27',
          '2026-03-31',
          '2026 Cleaning Schedule',
        ]
      )
      console.log(`✓ Updated ${name} (id ${customerId})`)
    } else {
      const ins = await pool.query(
        `INSERT INTO service_customers (name, service_description, frequency, last_service, next_service, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [name, 'Sunnybank', 'Monthly', '2026-02-27', '2026-03-31', '2026 Cleaning Schedule']
      )
      customerId = ins.rows[0].id as number
      console.log(`✓ Inserted ${name} (id ${customerId})`)
    }

    for (const line of LINES) {
      await pool.query(
        `INSERT INTO service_customer_schedule (customer_id, sort_order, visit_date, month_label, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [customerId, line.sort_order, line.visit_date, line.month_label, line.status]
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
