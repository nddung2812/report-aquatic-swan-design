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

    console.log('✓ Tables created successfully')
    await pool.end()
  } catch (error) {
    console.error('Migration failed:', error)
    await pool.end()
    process.exit(1)
  }
}

migrate()
