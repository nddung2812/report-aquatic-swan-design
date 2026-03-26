import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'
import { serviceLocationPatchSchema } from '../../src/lib/schemas.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query
    const locationId = parseInt(id as string)

    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'Invalid location ID' })
    }

    if (req.method === 'PATCH') {
      const parsed = serviceLocationPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
      }
      const d = parsed.data
      const cols: string[] = []
      const vals: unknown[] = []
      let i = 1
      if (d.label !== undefined) {
        cols.push(`label = $${i++}`)
        vals.push(d.label)
      }
      if (d.service_description !== undefined) {
        cols.push(`service_description = $${i++}`)
        vals.push(d.service_description || null)
      }
      if (d.frequency !== undefined) {
        cols.push(`frequency = $${i++}`)
        vals.push(d.frequency)
      }
      if (d.last_service !== undefined) {
        cols.push(`last_service = $${i++}`)
        vals.push(d.last_service)
      }
      if (d.next_service !== undefined) {
        cols.push(`next_service = $${i++}`)
        vals.push(d.next_service)
      }
      if (d.notes !== undefined) {
        cols.push(`notes = $${i++}`)
        vals.push(d.notes || null)
      }

      if (cols.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      vals.push(locationId)
      const result = await query(`UPDATE service_locations SET ${cols.join(', ')} WHERE id = $${i} RETURNING id`, vals)
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' })
      }
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const loc = await query('SELECT customer_id FROM service_locations WHERE id = $1', [locationId])
      if (loc.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' })
      }
      const customerId = (loc.rows[0] as { customer_id: number }).customer_id
      await query('DELETE FROM service_locations WHERE id = $1', [locationId])
      const count = await query('SELECT COUNT(*)::int AS n FROM service_locations WHERE customer_id = $1', [customerId])
      const n = (count.rows[0] as { n: number }).n
      if (n === 0) {
        await query('DELETE FROM service_customers WHERE id = $1', [customerId])
      }
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('service-locations/[id] error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
