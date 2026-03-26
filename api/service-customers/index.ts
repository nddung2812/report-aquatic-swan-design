import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const result = await query(
        'SELECT id, name, service_description, frequency, last_service, next_service, notes FROM service_customers ORDER BY next_service ASC NULLS LAST, name ASC'
      )
      const customers = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        service_description: row.service_description ?? '',
        frequency: row.frequency,
        last_service: row.last_service ? row.last_service.toISOString().split('T')[0] : null,
        next_service: row.next_service ? row.next_service.toISOString().split('T')[0] : null,
        notes: row.notes ?? '',
      }))
      return res.status(200).json(customers)
    }

    if (req.method === 'POST') {
      const { name, service_description, frequency, last_service, next_service, notes } = req.body
      if (!name || !frequency) {
        return res.status(400).json({ error: 'name and frequency are required' })
      }
      const result = await query(
        'INSERT INTO service_customers (name, service_description, frequency, last_service, next_service, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, service_description || null, frequency, last_service || null, next_service || null, notes || null]
      )
      return res.status(201).json({ id: result.rows[0].id })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('service-customers error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
