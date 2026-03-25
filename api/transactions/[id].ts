import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const transactionId = parseInt(req.query.id as string)
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' })
    }

    const { category } = req.body as { category: string }
    if (!category) {
      return res.status(400).json({ error: 'category required' })
    }

    const result = await query(
      'UPDATE transactions SET category = $1 WHERE id = $2 RETURNING id',
      [category, transactionId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    return res.status(200).json({ message: 'Category updated' })
  } catch (error) {
    console.error('Transaction PATCH error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
