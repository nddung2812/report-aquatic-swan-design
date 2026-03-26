import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'
import { serviceLocationCreateSchema } from '../../src/lib/schemas.js'
import { z } from 'zod'

const postBodySchema = serviceLocationCreateSchema.extend({
  customer_id: z.coerce.number().int().positive(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const parsed = postBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
    }
    const { customer_id, label, service_description, frequency, last_service, next_service, notes } = parsed.data

    const exist = await query('SELECT 1 FROM service_customers WHERE id = $1', [customer_id])
    if (exist.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const maxRow = await query(
      'SELECT COALESCE(MAX(sort_order), -1) AS m FROM service_locations WHERE customer_id = $1',
      [customer_id]
    )
    const sortOrder = (maxRow.rows[0] as { m: number }).m + 1

    const result = await query(
      `INSERT INTO service_locations (customer_id, label, service_description, frequency, last_service, next_service, notes, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        customer_id,
        label,
        service_description || null,
        frequency,
        last_service ?? null,
        next_service ?? null,
        notes || null,
        sortOrder,
      ]
    )
    return res.status(201).json({ id: result.rows[0].id })
  } catch (error) {
    console.error('service-locations error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
