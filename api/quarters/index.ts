import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'
import type { CashSource, Transaction, PLStatement } from '../../src/types/finance'

interface QuarterRecord {
  id: number
  label: string
  year: number
  quarter: number
  created_at: string
  cash_sources: CashSource[]
  transactions: Transaction[]
  pl_summary: PLStatement
}

interface SaveQuarterPayload {
  label: string
  year: number
  quarter: number
  cash_sources: CashSource[]
  transactions: Transaction[]
  pl_summary: PLStatement
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      return handleGet(res)
    } else if (req.method === 'POST') {
      return handlePost(req, res)
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

async function handleGet(res: VercelResponse) {
  const result = await query(
    `
    SELECT
      q.id, q.label, q.year, q.quarter, q.created_at,
      pl.total_income, pl.total_expenses, pl.net_profit
    FROM quarters q
    LEFT JOIN pl_summaries pl ON q.id = pl.quarter_id
    ORDER BY q.created_at DESC
    `
  )

  const quarters = result.rows.map((row: any) => ({
    id: row.id,
    label: row.label,
    year: row.year,
    quarter: row.quarter,
    created_at: row.created_at,
    pl_summary: {
      totalIncome: parseFloat(row.total_income || '0'),
      totalExpenses: parseFloat(row.total_expenses || '0'),
      netProfit: parseFloat(row.net_profit || '0'),
    },
  }))

  return res.status(200).json(quarters)
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const { label, year, quarter, cash_sources, transactions, pl_summary } =
    req.body as SaveQuarterPayload

  if (!label || !year || !quarter || !cash_sources || !transactions || !pl_summary) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Start transaction
  const client = await query('BEGIN')

  try {
    // Insert quarter
    const quarterResult = await query(
      'INSERT INTO quarters (label, year, quarter) VALUES ($1, $2, $3) RETURNING id',
      [label, year, quarter]
    )
    const quarterId = quarterResult.rows[0].id

    // Insert cash sources
    for (const source of cash_sources) {
      await query(
        'INSERT INTO cash_sources (quarter_id, source_id, label, opening_balance, closing_balance) VALUES ($1, $2, $3, $4, $5)',
        [quarterId, source.id, source.label, source.openingBalance, source.closingBalance]
      )
    }

    // Insert transactions
    for (const txn of transactions) {
      await query(
        'INSERT INTO transactions (quarter_id, date, description, amount, balance, category, type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [quarterId, txn.date, txn.description, txn.amount, txn.balance, txn.category, txn.type]
      )
    }

    // Insert P&L summary
    await query(
      'INSERT INTO pl_summaries (quarter_id, total_income, total_expenses, net_profit) VALUES ($1, $2, $3, $4)',
      [quarterId, pl_summary.totalIncome, pl_summary.totalExpenses, pl_summary.netProfit]
    )

    await query('COMMIT')

    return res.status(201).json({
      id: quarterId,
      label,
      year,
      quarter,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    await query('ROLLBACK')
    throw error
  }
}
