import dotenv from 'dotenv'
import { Pool } from '@neondatabase/serverless'

dotenv.config()

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    console.log('Creating tables...')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quarters (
        id SERIAL PRIMARY KEY,
        label VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        quarter INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cash_sources (
        id SERIAL PRIMARY KEY,
        quarter_id INTEGER REFERENCES quarters(id) ON DELETE CASCADE,
        source_id VARCHAR(50) NOT NULL,
        label VARCHAR(100) NOT NULL,
        opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
        closing_balance DECIMAL(12,2) NOT NULL DEFAULT 0
      );
    `)

    // Drop old balance column if it exists
    try {
      await pool.query(`
        ALTER TABLE cash_sources
        DROP COLUMN IF EXISTS balance;
      `)
      console.log('✓ Dropped old balance column')
    } catch (e) {
      // Column might not exist
    }

    // Add missing columns to existing cash_sources table
    try {
      await pool.query(`
        ALTER TABLE cash_sources
        ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0;
      `)
      console.log('✓ Added opening_balance column')
    } catch (e) {
      // Column might already exist
    }

    try {
      await pool.query(`
        ALTER TABLE cash_sources
        ADD COLUMN IF NOT EXISTS closing_balance DECIMAL(12,2) NOT NULL DEFAULT 0;
      `)
      console.log('✓ Added closing_balance column')
    } catch (e) {
      // Column might already exist
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        quarter_id INTEGER REFERENCES quarters(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        balance DECIMAL(12,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pl_summaries (
        id SERIAL PRIMARY KEY,
        quarter_id INTEGER REFERENCES quarters(id) ON DELETE CASCADE,
        total_income DECIMAL(12,2) NOT NULL,
        total_expenses DECIMAL(12,2) NOT NULL,
        net_profit DECIMAL(12,2) NOT NULL
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        service_description TEXT,
        frequency VARCHAR(50) NOT NULL,
        last_service DATE,
        next_service DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_customer_schedule (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES service_customers(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        visit_date DATE NOT NULL,
        month_label VARCHAR(32) NOT NULL,
        status VARCHAR(32),
        UNIQUE (customer_id, sort_order)
      );
    `)

    await pool.query(`
      UPDATE service_customer_schedule SET status = 'not_yet' WHERE status IS NULL;
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_locations (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES service_customers(id) ON DELETE CASCADE,
        label VARCHAR(255) NOT NULL DEFAULT 'Primary',
        service_description TEXT,
        frequency VARCHAR(50) NOT NULL,
        last_service DATE,
        next_service DATE,
        notes TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await pool.query(`
      ALTER TABLE service_customers ADD COLUMN IF NOT EXISTS notes TEXT;
    `)

    const colCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'service_customer_schedule' AND column_name = 'customer_id'
    `)

    if (colCheck.rows.length > 0) {
      await pool.query(`
        INSERT INTO service_locations (customer_id, label, service_description, frequency, last_service, next_service, notes, sort_order)
        SELECT c.id, 'Primary', COALESCE(c.service_description, ''), COALESCE(NULLIF(TRIM(c.frequency), ''), 'Monthly'),
               c.last_service, c.next_service, COALESCE(c.notes, ''), 0
        FROM service_customers c
        WHERE NOT EXISTS (SELECT 1 FROM service_locations l WHERE l.customer_id = c.id);
      `)

      await pool.query(`
        ALTER TABLE service_customer_schedule ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES service_locations(id) ON DELETE CASCADE;
      `)

      await pool.query(`
        UPDATE service_customer_schedule s
        SET location_id = (
          SELECT l.id FROM service_locations l
          WHERE l.customer_id = s.customer_id
          ORDER BY l.sort_order, l.id
          LIMIT 1
        )
        WHERE s.location_id IS NULL AND s.customer_id IS NOT NULL;
      `)

      await pool.query(`
        ALTER TABLE service_customer_schedule DROP CONSTRAINT IF EXISTS service_customer_schedule_customer_id_fkey;
      `)
      await pool.query(`
        ALTER TABLE service_customer_schedule DROP CONSTRAINT IF EXISTS service_customer_schedule_customer_id_sort_order_key;
      `)
      await pool.query(`
        ALTER TABLE service_customer_schedule DROP COLUMN IF EXISTS customer_id;
      `)
      await pool.query(`
        ALTER TABLE service_customer_schedule ALTER COLUMN location_id SET NOT NULL;
      `)
      await pool.query(`
        ALTER TABLE service_customer_schedule ADD CONSTRAINT service_customer_schedule_location_sort_order UNIQUE (location_id, sort_order);
      `)

      await pool.query(`
        ALTER TABLE service_customers DROP COLUMN IF EXISTS service_description;
      `)
      await pool.query(`
        ALTER TABLE service_customers DROP COLUMN IF EXISTS frequency;
      `)
      await pool.query(`
        ALTER TABLE service_customers DROP COLUMN IF EXISTS last_service;
      `)
      await pool.query(`
        ALTER TABLE service_customers DROP COLUMN IF EXISTS next_service;
      `)

      console.log('✓ Migrated service_customers → service_locations')
    }

    console.log('✓ Tables created successfully')
    await pool.end()
  } catch (error) {
    console.error('Migration failed:', error)
    await pool.end()
    process.exit(1)
  }
}

migrate()
