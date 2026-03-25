import dotenv from 'dotenv'
import { Pool } from '@neondatabase/serverless'

dotenv.config()

const cashSources = [
  { id: 'paypal', label: 'PayPal' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'commbank_transaction', label: 'CommBank Transaction Account' },
  { id: 'commbank_saver', label: 'CommBank Saver Account' },
]

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set')

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    for (const { quarter, label } of [
      { quarter: 3, label: 'Q3 2025' },
      { quarter: 4, label: 'Q4 2025' },
    ]) {
      // Skip if already exists
      const existing = await pool.query(
        'SELECT id FROM quarters WHERE year = $1 AND quarter = $2',
        [2025, quarter]
      )
      if (existing.rows.length > 0) {
        console.log(`✓ ${label} already exists, skipping`)
        continue
      }

      const result = await pool.query(
        'INSERT INTO quarters (label, year, quarter) VALUES ($1, $2, $3) RETURNING id',
        [label, 2025, quarter]
      )
      const quarterId = result.rows[0].id

      for (const source of cashSources) {
        await pool.query(
          'INSERT INTO cash_sources (quarter_id, source_id, label, opening_balance, closing_balance) VALUES ($1, $2, $3, 0, 0)',
          [quarterId, source.id, source.label]
        )
      }

      await pool.query(
        'INSERT INTO pl_summaries (quarter_id, total_income, total_expenses, net_profit) VALUES ($1, 0, 0, 0)',
        [quarterId]
      )

      console.log(`✓ Created ${label} (id: ${quarterId})`)
    }

    await pool.end()
  } catch (error) {
    console.error('Seed failed:', error)
    await pool.end()
    process.exit(1)
  }
}

seed()
