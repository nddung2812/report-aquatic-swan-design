import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'
import { scheduleLinePatchSchema } from '../../src/lib/schemas.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query
    const lineId = parseInt(id as string)

    if (isNaN(lineId)) {
      return res.status(400).json({ error: 'Invalid schedule line ID' })
    }

    if (req.method === 'PATCH') {
      const parsed = scheduleLinePatchSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
      }
      const result = await query(
        'UPDATE service_customer_schedule SET status = $1 WHERE id = $2 RETURNING id',
        [parsed.data.status, lineId]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule line not found' })
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('service-customer-schedule/[id] error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
