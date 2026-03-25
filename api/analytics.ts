import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from './_db.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const [quarterlyResult, monthlyResult] = await Promise.all([
      query(`
        SELECT q.id, q.label, q.year, q.quarter,
          COALESCE(pl.total_income, 0) AS income,
          COALESCE(pl.total_expenses, 0) AS expenses,
          COALESCE(pl.net_profit, 0) AS profit,
          COALESCE(SUM(cs.opening_balance), 0) AS opening,
          COALESCE(SUM(cs.closing_balance), 0) AS closing
        FROM quarters q
        LEFT JOIN pl_summaries pl ON q.id = pl.quarter_id
        LEFT JOIN cash_sources cs ON q.id = cs.quarter_id
        GROUP BY q.id, q.label, q.year, q.quarter, pl.total_income, pl.total_expenses, pl.net_profit
        ORDER BY q.year ASC, q.quarter ASC
      `),
      query(`
        SELECT TO_CHAR(date, 'YYYY-MM') AS month,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
        FROM transactions
        GROUP BY month
        ORDER BY month ASC
      `),
    ])

    const quarterly = quarterlyResult.rows.map((r: any) => ({
      id: r.id,
      label: r.label,
      year: r.year,
      quarter: r.quarter,
      income: parseFloat(r.income),
      expenses: parseFloat(r.expenses),
      profit: parseFloat(r.profit),
      opening: parseFloat(r.opening),
      closing: parseFloat(r.closing),
    }))

    const monthly = monthlyResult.rows.map((r: any) => {
      const [year, month] = r.month.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      const label = date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
      const income = parseFloat(r.income)
      const expenses = parseFloat(r.expenses)
      return { month: r.month, label, income, expenses, profit: income - expenses }
    })

    return res.status(200).json({ quarterly, monthly })
  } catch (error) {
    console.error('Analytics error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
