import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { badgeVariants } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { serviceCustomerCreateSchema, serviceFrequencyValues } from '@/lib/schemas'
import type { ServiceCustomer, ServiceLineStatus } from '@/types/finance'
import { cn } from '@/lib/utils'

type ServiceCustomerFormValues = import('@/lib/schemas').ServiceCustomerCreateInput

const emptyDefaults: ServiceCustomerFormValues = {
  name: '',
  service_description: '',
  frequency: 'Monthly',
  last_service: undefined,
  next_service: undefined,
  notes: '',
}

function scheduleStatusBadgeClass(status: ServiceLineStatus): string {
  if (status === 'done') {
    return 'border-green-600 bg-green-600 text-white hover:opacity-90 dark:border-green-600 dark:bg-green-700 dark:text-white'
  }
  if (status === 'soon') {
    return 'border-amber-400 bg-amber-200 text-amber-950 hover:opacity-90 dark:border-amber-600 dark:bg-amber-800 dark:text-amber-50'
  }
  return ''
}

function toFormDefaults(c: ServiceCustomer): ServiceCustomerFormValues {
  return {
    name: c.name,
    service_description: c.service_description || '',
    frequency: c.frequency,
    last_service: c.last_service ?? undefined,
    next_service: c.next_service ?? undefined,
    notes: c.notes || '',
  }
}

export function RegularServiceView() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<ServiceCustomer | null>(null)
  const [statusPickerLineId, setStatusPickerLineId] = useState<number | null>(null)

  const { data: customers, isLoading } = useQuery({
    queryKey: ['service-customers'],
    queryFn: async () => {
      const res = await fetch('/api/service-customers')
      if (!res.ok) throw new Error('Failed to load customers')
      return res.json() as Promise<ServiceCustomer[]>
    },
  })

  const form = useForm<ServiceCustomerFormValues>({
    resolver: zodResolver(serviceCustomerCreateSchema),
    defaultValues: emptyDefaults,
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form
  const frequency = watch('frequency')

  useEffect(() => {
    if (dialog === 'edit' && editing) {
      reset(toFormDefaults(editing))
    } else if (dialog === 'add') {
      reset(emptyDefaults)
    }
  }, [dialog, editing, reset])

  const createMutation = useMutation({
    mutationFn: async (body: ServiceCustomerFormValues) => {
      const res = await fetch('/api/service-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          last_service: body.last_service ?? null,
          next_service: body.next_service ?? null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-customers'] })
      setDialog(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: ServiceCustomerFormValues }) => {
      const res = await fetch(`/api/service-customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          last_service: body.last_service ?? null,
          next_service: body.next_service ?? null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-customers'] })
      setDialog(null)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/service-customers/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-customers'] })
    },
  })

  const scheduleStatusOptions: { value: ServiceLineStatus; label: string }[] = [
    { value: 'done', label: 'Done' },
    { value: 'not_yet', label: 'Not Yet' },
    { value: 'soon', label: 'Soon' },
    { value: 'free_service', label: 'Free service' },
  ]

  const updateScheduleStatusMutation = useMutation({
    mutationFn: async ({ lineId, status }: { lineId: number; status: ServiceLineStatus }) => {
      const res = await fetch(`/api/service-customer-schedule/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update status')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-customers'] })
      setStatusPickerLineId(null)
    },
  })

  useEffect(() => {
    if (statusPickerLineId === null) return
    const onDocMouseDown = (e: MouseEvent) => {
      const open = document.querySelector('[data-status-picker="open"]')
      if (open && !open.contains(e.target as Node)) setStatusPickerLineId(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatusPickerLineId(null)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [statusPickerLineId])

  const onSubmit = (data: ServiceCustomerFormValues) => {
    if (dialog === 'add') {
      createMutation.mutate(data)
    } else if (dialog === 'edit' && editing) {
      updateMutation.mutate({ id: editing.id, body: data })
    }
  }

  const openAdd = () => {
    setEditing(null)
    setDialog('add')
  }

  const openEdit = (c: ServiceCustomer) => {
    setEditing(c)
    setDialog('edit')
  }

  const closeDialog = () => {
    setDialog(null)
    setEditing(null)
  }

  const handleDelete = (c: ServiceCustomer) => {
    if (!window.confirm(`Delete ${c.name}?`)) return
    deleteMutation.mutate(c.id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">Regular Service</h1>
        <p className="mt-1 text-sm text-muted-foreground md:mt-2">
          Customers on a recurring schedule — sorted by next service date.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b">
          <div>
            <CardTitle>Service schedule</CardTitle>
            <CardDescription>Last and next visit dates per customer.</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={openAdd}>
            <Plus className="size-4" />
            Add customer
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!isLoading && customers && customers.length === 0 && (
            <p className="text-sm text-muted-foreground">No regular customers yet. Add one to get started.</p>
          )}
          {!isLoading && customers && customers.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="max-w-[200px]">Service</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Last service</TableHead>
                    <TableHead>Next service</TableHead>
                    <TableHead className="max-w-[180px]">Notes</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <Fragment key={c.id}>
                      <TableRow>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground">
                          {c.service_description || '—'}
                        </TableCell>
                        <TableCell>{c.frequency}</TableCell>
                        <TableCell>{c.last_service || '—'}</TableCell>
                        <TableCell>{c.next_service || '—'}</TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground max-w-[180px]">
                          {c.notes || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Edit ${c.name}`}
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Delete ${c.name}`}
                              onClick={() => handleDelete(c)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {c.schedule && c.schedule.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/20 py-3 align-top">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Visit schedule</p>
                            <ul className="space-y-2 text-sm">
                              {c.schedule.map((line) => (
                                <li
                                  key={line.id}
                                  className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/50 pb-2 last:border-0 last:pb-0"
                                >
                                  <span className="min-w-[5rem] font-medium text-foreground">{line.month_label}</span>
                                  <span className="min-w-0 flex-1 text-muted-foreground">
                                    {format(parseISO(line.visit_date), 'EEEE, d MMMM yyyy')}
                                  </span>
                                  <div
                                    className="relative shrink-0"
                                    data-status-picker={statusPickerLineId === line.id ? 'open' : undefined}
                                  >
                                    <button
                                      type="button"
                                      className={cn(
                                        badgeVariants({ variant: 'outline' }),
                                        scheduleStatusBadgeClass(line.status),
                                        'h-6 min-h-6 cursor-pointer px-2.5 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
                                      )}
                                      onClick={() =>
                                        setStatusPickerLineId((id) => (id === line.id ? null : line.id))
                                      }
                                      disabled={
                                        updateScheduleStatusMutation.isPending &&
                                        updateScheduleStatusMutation.variables?.lineId === line.id
                                      }
                                      aria-expanded={statusPickerLineId === line.id}
                                      aria-haspopup="listbox"
                                      aria-label={`Status: ${scheduleStatusOptions.find((o) => o.value === line.status)?.label ?? line.status}. Change status`}
                                    >
                                      {scheduleStatusOptions.find((o) => o.value === line.status)?.label ??
                                        line.status}
                                    </button>
                                    {statusPickerLineId === line.id && (
                                      <div
                                        role="listbox"
                                        className="absolute right-0 top-full z-50 mt-1 min-w-[10.5rem] rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
                                      >
                                        {scheduleStatusOptions.map((opt) => (
                                          <button
                                            key={opt.value}
                                            type="button"
                                            role="option"
                                            aria-selected={line.status === opt.value}
                                            className={cn(
                                              'flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                                              line.status === opt.value && 'bg-muted/80 font-medium'
                                            )}
                                            onClick={() =>
                                              updateScheduleStatusMutation.mutate({
                                                lineId: line.id,
                                                status: opt.value,
                                              })
                                            }
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-dialog-title"
            className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="service-dialog-title" className="text-lg font-semibold">
              {dialog === 'add' ? 'Add customer' : 'Edit customer'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
                <input
                  {...register('name')}
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    errors.name && 'border-destructive'
                  )}
                />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Service description</label>
                <input
                  {...register('service_description')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Frequency</label>
                  <Select value={frequency} onValueChange={(v) => setValue('frequency', v as ServiceCustomerFormValues['frequency'])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceFrequencyValues.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.frequency && (
                  <p className="mt-1 text-xs text-destructive">{errors.frequency.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Last service</label>
                  <input
                    type="date"
                    {...register('last_service')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Next service</label>
                  <input
                    type="date"
                    {...register('next_service')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {dialog === 'add' ? 'Add' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
