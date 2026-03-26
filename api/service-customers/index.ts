import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'
import { serviceCustomerCreateSchema } from '../../src/lib/schemas.js'
import type { ServiceLineStatus } from '../../src/types/finance.js'

function normalizeLineStatus(raw: string | null): ServiceLineStatus {
  if (raw === 'done' || raw === 'not_yet' || raw === 'soon' || raw === 'free_service') return raw
  return 'not_yet'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const result = await query(
        'SELECT id, name, service_description, frequency, last_service, next_service, notes FROM service_customers ORDER BY next_service ASC NULLS LAST, name ASC'
      )
      const rows = result.rows as any[]
      const ids = rows.map((r) => r.id)
      let byCustomer: Record<number, unknown[]> = {}
      if (ids.length > 0) {
        const sched = await query(
          `SELECT id, customer_id, sort_order, visit_date, month_label, status
           FROM service_customer_schedule
           WHERE customer_id = ANY($1::int[])
           ORDER BY customer_id, sort_order`,
          [ids]
        )
        for (const s of sched.rows as any[]) {
          const cid = s.customer_id
          if (!byCustomer[cid]) byCustomer[cid] = []
          byCustomer[cid].push({
            id: s.id,
            sort_order: s.sort_order,
            visit_date: s.visit_date ? s.visit_date.toISOString().split('T')[0] : null,
            month_label: s.month_label,
            status: normalizeLineStatus(s.status),
          })
        }
      }
      const customers = rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        service_description: row.service_description ?? '',
        frequency: row.frequency,
        last_service: row.last_service ? row.last_service.toISOString().split('T')[0] : null,
        next_service: row.next_service ? row.next_service.toISOString().split('T')[0] : null,
        notes: row.notes ?? '',
        schedule: byCustomer[row.id] ?? [],
      }))
      return res.status(200).json(customers)
    }

    if (req.method === 'POST') {
      const parsed = serviceCustomerCreateSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
      }
      const { name, service_description, frequency, last_service, next_service, notes } = parsed.data
      const result = await query(
        'INSERT INTO service_customers (name, service_description, frequency, last_service, next_service, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, service_description || null, frequency, last_service ?? null, next_service ?? null, notes || null]
      )
      return res.status(201).json({ id: result.rows[0].id })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('service-customers error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
