import { z } from 'zod'

export const filterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['all', 'income', 'expense']),
  category: z.string().optional(),
})

export type FilterFormData = z.infer<typeof filterSchema>
