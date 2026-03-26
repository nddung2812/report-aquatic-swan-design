import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'
import { serviceCustomerPatchSchema } from '../../src/lib/schemas.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query
    const customerId = parseInt(id as string)

    if (isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID' })
    }

    if (req.method === 'PATCH') {
      const parsed = serviceCustomerPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
      }
      const d = parsed.data

      const cols: string[] = []
      const vals: unknown[] = []
      let i = 1
      if (d.name !== undefined) {
        cols.push(`name = $${i++}`)
        vals.push(d.name)
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

      vals.push(customerId)
      await query(`UPDATE service_customers SET ${cols.join(', ')} WHERE id = $${i}`, vals)
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const result = await query('DELETE FROM service_customers WHERE id = $1 RETURNING id', [customerId])
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' })
      }
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('service-customers/[id] error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
