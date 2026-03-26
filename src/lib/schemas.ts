import { z } from 'zod'

export const filterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['all', 'income', 'expense']),
  category: z.string().optional(),
})

export type FilterFormData = z.infer<typeof filterSchema>

export const serviceFrequencyValues = [
  'Monthly',
  'Bi-Monthly',
  'Quarterly',
  'Bi-Annually',
  'Annually',
] as const

const optionalDate = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal(''),
    z.null(),
  ])
  .transform((v) => (v === '' ? null : v))

export const serviceLocationCreateSchema = z.object({
  label: z.string().min(1),
  service_description: z.string().optional(),
  frequency: z.enum(serviceFrequencyValues),
  last_service: optionalDate.optional(),
  next_service: optionalDate.optional(),
  notes: z.string().optional(),
})

export type ServiceLocationCreateInput = z.infer<typeof serviceLocationCreateSchema>

export const serviceLocationPatchSchema = serviceLocationCreateSchema.partial()

export type ServiceLocationPatchInput = z.infer<typeof serviceLocationPatchSchema>

export const serviceCustomerCreateSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
  location: serviceLocationCreateSchema.optional(),
})

export type ServiceCustomerCreateInput = z.infer<typeof serviceCustomerCreateSchema>

export const serviceCustomerPatchSchema = z.object({
  name: z.string().min(1).optional(),
  notes: z.string().optional(),
})

export type ServiceCustomerPatchInput = z.infer<typeof serviceCustomerPatchSchema>

export const regularServiceDialogSchema = z.object({
  customerName: z.string().min(1),
  customerNotes: z.string().optional(),
  label: z.string().min(1),
  service_description: z.string().optional(),
  frequency: z.enum(serviceFrequencyValues),
  last_service: optionalDate.optional(),
  next_service: optionalDate.optional(),
  notes: z.string().optional(),
})

export type RegularServiceDialogInput = z.infer<typeof regularServiceDialogSchema>

export const serviceScheduleLineStatusValues = ['done', 'not_yet', 'soon', 'free_service'] as const

export const scheduleLinePatchSchema = z.object({
  status: z.enum(serviceScheduleLineStatusValues),
})

export type ScheduleLinePatchInput = z.infer<typeof scheduleLinePatchSchema>
