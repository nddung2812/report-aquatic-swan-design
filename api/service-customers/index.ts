import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../_db.js'
import { serviceCustomerCreateSchema, serviceLocationCreateSchema } from '../../src/lib/schemas.js'
import type { ServiceLineStatus } from '../../src/types/finance.js'

function normalizeLineStatus(raw: string | null): ServiceLineStatus {
  if (raw === 'done' || raw === 'not_yet' || raw === 'soon' || raw === 'free_service') return raw
  return 'not_yet'
}

function normalizeFrequency(raw: string): string {
  const v = ['Monthly', 'Bi-Monthly', 'Quarterly', 'Bi-Annually', 'Annually']
  return v.includes(raw) ? raw : 'Monthly'
}

/** Neon/pg often returns DATE as string; calling .toISOString() on that throws → 500 */
function formatPgDate(d: unknown): string | null {
  if (d == null || d === '') return null
  if (d instanceof Date) return d.toISOString().split('T')[0]
  if (typeof d === 'string') return d.slice(0, 10)
  return null
}

function formatPgDateStr(d: unknown): string {
  return formatPgDate(d) ?? ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const custResult = await query(
        `SELECT id, name, COALESCE(notes, '') AS notes
         FROM service_customers
         ORDER BY LOWER(name) ASC`
      )
      const rows = custResult.rows as any[]
      const customers: any[] = []
      for (const row of rows) {
        const locResult = await query(
          `SELECT id, customer_id, label, service_description, frequency, last_service, next_service, notes, sort_order
           FROM service_locations WHERE customer_id = $1 ORDER BY sort_order, id`,
          [row.id]
        )
        const locations: any[] = []
        for (const loc of locResult.rows as any[]) {
          const sched = await query(
            `SELECT id, sort_order, visit_date, month_label, status
             FROM service_customer_schedule WHERE location_id = $1 ORDER BY sort_order`,
            [loc.id]
          )
          const schedule = (sched.rows as any[]).map((s) => ({
            id: s.id,
            sort_order: s.sort_order,
            visit_date: formatPgDateStr(s.visit_date),
            month_label: s.month_label,
            status: normalizeLineStatus(s.status),
          }))
          locations.push({
            id: loc.id,
            customer_id: loc.customer_id,
            label: loc.label,
            service_description: loc.service_description ?? '',
            frequency: normalizeFrequency(loc.frequency),
            last_service: formatPgDate(loc.last_service),
            next_service: formatPgDate(loc.next_service),
            notes: loc.notes ?? '',
            schedule,
          })
        }
        customers.push({
          id: row.id,
          name: row.name,
          notes: row.notes ?? '',
          locations,
        })
      }
      return res.status(200).json(customers)
    }

    if (req.method === 'POST') {
      const parsed = serviceCustomerCreateSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
      }
      const { name, notes } = parsed.data
      const locDefault = serviceLocationCreateSchema.safeParse(
        parsed.data.location ?? {
          label: 'Primary',
          service_description: '',
          frequency: 'Monthly' as const,
          last_service: undefined,
          next_service: undefined,
          notes: '',
        }
      )
      if (!locDefault.success) {
        return res.status(400).json({ error: 'Invalid location', details: locDefault.error.flatten() })
      }
      const d = locDefault.data
      const cust = await query(
        `INSERT INTO service_customers (name, notes) VALUES ($1, $2) RETURNING id`,
        [name, notes || null]
      )
      const customerId = cust.rows[0].id as number
      await query(
        `INSERT INTO service_locations (customer_id, label, service_description, frequency, last_service, next_service, notes, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0)`,
        [
          customerId,
          d.label,
          d.service_description || null,
          d.frequency,
          d.last_service ?? null,
          d.next_service ?? null,
          d.notes || null,
        ]
      )
      return res.status(201).json({ id: customerId })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('service-customers error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
