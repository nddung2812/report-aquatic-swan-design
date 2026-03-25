import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'
import type { CashSource, Transaction, PLStatement } from '../../src/types/finance.js'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query
    const quarterId = parseInt(id as string)

    if (isNaN(quarterId)) {
      return res.status(400).json({ error: 'Invalid quarter ID' })
    }

    if (req.method === 'GET') {
      return handleGet(quarterId, res)
    } else if (req.method === 'PATCH') {
      return handlePatch(quarterId, req, res)
    } else if (req.method === 'DELETE') {
      return handleDelete(quarterId, res)
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

async function handleGet(quarterId: number, res: VercelResponse) {
  // Get quarter info
  const quarterResult = await query('SELECT id, label, year, quarter, created_at FROM quarters WHERE id = $1', [
    quarterId,
  ])

  if (quarterResult.rows.length === 0) {
    return res.status(404).json({ error: 'Quarter not found' })
  }

  const quarter = quarterResult.rows[0]

  // Get cash sources
  const cashResult = await query('SELECT source_id, label, opening_balance, closing_balance FROM cash_sources WHERE quarter_id = $1', [
    quarterId,
  ])
  const cashSources = cashResult.rows.map((row: any) => ({
    id: row.source_id,
    label: row.label,
    openingBalance: parseFloat(row.opening_balance),
    closingBalance: parseFloat(row.closing_balance),
  }))

  // Get transactions
  const txnResult = await query(
    'SELECT id, date, description, amount, balance, category, type FROM transactions WHERE quarter_id = $1 ORDER BY date',
    [quarterId]
  )
  const transactions = txnResult.rows.map((row: any) => ({
    id: row.id,
    date: row.date,
    description: row.description,
    amount: parseFloat(row.amount),
    balance: parseFloat(row.balance),
    category: row.category,
    type: row.type,
  }))

  // Get P&L summary
  const plResult = await query('SELECT total_income, total_expenses, net_profit FROM pl_summaries WHERE quarter_id = $1', [
    quarterId,
  ])
  const pl = plResult.rows[0]
  const plSummary: PLStatement = {
    totalIncome: pl ? parseFloat(pl.total_income) : 0,
    totalExpenses: pl ? parseFloat(pl.total_expenses) : 0,
    netProfit: pl ? parseFloat(pl.net_profit) : 0,
    byCategory: [],
  }

  return res.status(200).json({
    id: quarter.id,
    label: quarter.label,
    year: quarter.year,
    quarter: quarter.quarter,
    created_at: quarter.created_at,
    cash_sources: cashSources,
    transactions,
    pl_summary: plSummary,
  })
}

async function handlePatch(quarterId: number, req: VercelRequest, res: VercelResponse) {
  const { cash_sources, transactions } = req.body as { cash_sources?: CashSource[], transactions?: Transaction[] }

  if (cash_sources) {
    for (const source of cash_sources) {
      await query(
        'UPDATE cash_sources SET opening_balance = $1, closing_balance = $2 WHERE quarter_id = $3 AND source_id = $4',
        [source.openingBalance, source.closingBalance, quarterId, source.id]
      )
    }
  }

  if (transactions) {
    await query('DELETE FROM transactions WHERE quarter_id = $1', [quarterId])
    for (const txn of transactions) {
      await query(
        'INSERT INTO transactions (quarter_id, date, description, amount, balance, category, type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [quarterId, txn.date, txn.description, txn.amount, txn.balance, txn.category, txn.type]
      )
    }

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    await query('DELETE FROM pl_summaries WHERE quarter_id = $1', [quarterId])
    await query(
      'INSERT INTO pl_summaries (quarter_id, total_income, total_expenses, net_profit) VALUES ($1, $2, $3, $4)',
      [quarterId, totalIncome, totalExpenses, totalIncome - totalExpenses]
    )
  }

  return res.status(200).json({ message: 'Quarter updated' })
}

async function handleDelete(quarterId: number, res: VercelResponse) {
  const result = await query('DELETE FROM quarters WHERE id = $1', [quarterId])

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Quarter not found' })
  }

  return res.status(200).json({ message: 'Quarter deleted successfully' })
}
