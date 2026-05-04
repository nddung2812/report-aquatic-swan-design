import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { CalendarRange, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
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
import { regularServiceDialogSchema, serviceFrequencyValues } from '@/lib/schemas'
import type {
  ServiceCustomer,
  ServiceLineStatus,
  ServiceLocation,
  ServiceScheduleLine,
} from '@/types/finance'
import { cn } from '@/lib/utils'

type DialogFormValues = import('@/lib/schemas').RegularServiceDialogInput

const emptyDefaults: DialogFormValues = {
  customerName: '',
  customerNotes: '',
  label: 'Primary',
  service_description: '',
  frequency: 'Monthly',
  last_service: undefined,
  next_service: undefined,
  notes: '',
}

const STATUS_MENU_GAP = 6
const VIEWPORT_PAD = 8

function FloatingScheduleStatusMenu({
  anchorEl,
  line,
  options,
  onSelect,
}: {
  anchorEl: HTMLElement
  line: ServiceScheduleLine
  options: { value: ServiceLineStatus; label: string }[]
  onSelect: (status: ServiceLineStatus) => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({})

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!anchorEl || !menu) return

    const update = () => {
      const r = anchorEl.getBoundingClientRect()
      const mw = menu.offsetWidth
      const mh = menu.offsetHeight
      let top: number
      const spaceBelow = window.innerHeight - r.bottom - STATUS_MENU_GAP - VIEWPORT_PAD
      const spaceAbove = r.top - STATUS_MENU_GAP - VIEWPORT_PAD
      if (spaceBelow >= mh || spaceBelow >= spaceAbove) {
        top = Math.min(r.bottom + STATUS_MENU_GAP, window.innerHeight - VIEWPORT_PAD - mh)
        top = Math.max(VIEWPORT_PAD, top)
      } else {
        top = Math.max(VIEWPORT_PAD, r.top - STATUS_MENU_GAP - mh)
      }
      let left = r.right - mw
      left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - VIEWPORT_PAD - mw))
      setStyle({
        position: 'fixed',
        top,
        left,
        zIndex: 200,
      })
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(menu)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchorEl])

  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      style={style}
      data-status-picker-menu
      className="min-w-[10.5rem] rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="option"
          aria-selected={line.status === opt.value}
          className={cn(
            'flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
            line.status === opt.value && 'bg-muted/80 font-medium'
          )}
          onClick={() => onSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>,
    document.body
  )
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

const SOON_WINDOW_DAYS = 7

function todayIsoDate(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDaysIso(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Derive display status from stored status + visit date.
 *  Stored 'not_yet' rows whose visit_date is on or before today+7d (including overdue) display as 'soon'.
 *  All other statuses (done, soon, free_service) pass through unchanged. */
function effectiveScheduleStatus(
  stored: ServiceLineStatus,
  visitDate: string,
  soonCutoffIso: string
): ServiceLineStatus {
  if (stored !== 'not_yet') return stored
  if (!visitDate) return stored
  return visitDate <= soonCutoffIso ? 'soon' : stored
}

function toFormDefaults(customer: ServiceCustomer, location: ServiceLocation): DialogFormValues {
  return {
    customerName: customer.name,
    customerNotes: customer.notes || '',
    label: location.label,
    service_description: location.service_description || '',
    frequency: location.frequency,
    last_service: location.last_service ?? undefined,
    next_service: location.next_service ?? undefined,
    notes: location.notes || '',
  }
}

export function RegularServiceView() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<{ customer: ServiceCustomer; location: ServiceLocation } | null>(null)
  const [statusPickerLineId, setStatusPickerLineId] = useState<number | null>(null)
  const [pickerAnchorEl, setPickerAnchorEl] = useState<HTMLElement | null>(null)
  const [sidebarLocationId, setSidebarLocationId] = useState<number | null>(null)

  const { data: customers, isLoading } = useQuery({
    queryKey: ['service-customers'],
    queryFn: async () => {
      const res = await fetch('/api/service-customers')
      if (!res.ok) throw new Error('Failed to load customers')
      return res.json() as Promise<ServiceCustomer[]>
    },
  })

  const soonCutoffIso = useMemo(() => addDaysIso(todayIsoDate(), SOON_WINDOW_DAYS), [])

  const flatRows = useMemo(() => {
    if (!customers) return []
    return customers
      .flatMap((c) => c.locations.map((loc) => ({ customer: c, location: loc })))
      .sort((a, b) => {
        const byName = a.customer.name.localeCompare(b.customer.name, undefined, { sensitivity: 'base' })
        if (byName !== 0) return byName
        return a.location.label.localeCompare(b.location.label, undefined, { sensitivity: 'base' })
      })
  }, [customers])

  const form = useForm<DialogFormValues>({
    resolver: zodResolver(regularServiceDialogSchema),
    defaultValues: emptyDefaults,
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form
  const frequency = watch('frequency')

  useEffect(() => {
    if (dialog === 'edit' && editing) {
      reset(toFormDefaults(editing.customer, editing.location))
    } else if (dialog === 'add') {
      reset(emptyDefaults)
    }
  }, [dialog, editing, reset])

  const createMutation = useMutation({
    mutationFn: async (body: DialogFormValues) => {
      const res = await fetch('/api/service-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: body.customerName,
          notes: body.customerNotes || undefined,
          location: {
            label: body.label,
            service_description: body.service_description,
            frequency: body.frequency,
            last_service: body.last_service ?? null,
            next_service: body.next_service ?? null,
            notes: body.notes,
          },
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

  const saveEditMutation = useMutation({
    mutationFn: async (body: DialogFormValues & { customerId: number; locationId: number }) => {
      const { customerId, locationId, ...data } = body
      const cRes = await fetch(`/api/service-customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.customerName,
          notes: data.customerNotes || null,
        }),
      })
      if (!cRes.ok) {
        const err = await cRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update customer')
      }
      const lRes = await fetch(`/api/service-locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: data.label,
          service_description: data.service_description,
          frequency: data.frequency,
          last_service: data.last_service ?? null,
          next_service: data.next_service ?? null,
          notes: data.notes || null,
        }),
      })
      if (!lRes.ok) {
        const err = await lRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update location')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-customers'] })
      setDialog(null)
      setEditing(null)
    },
  })

  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: number) => {
      const res = await fetch(`/api/service-locations/${locationId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete')
      }
    },
    onSuccess: (_d, locationId) => {
      queryClient.invalidateQueries({ queryKey: ['service-customers'] })
      setSidebarLocationId((prev) => (prev === locationId ? null : prev))
    },
  })

  const addLocationMutation = useMutation({
    mutationFn: async ({ customerId, label }: { customerId: number; label: string }) => {
      const res = await fetch('/api/service-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          label,
          service_description: '',
          frequency: 'Monthly',
          notes: '',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to add location')
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
      setPickerAnchorEl(null)
    },
  })

  useEffect(() => {
    if (statusPickerLineId === null) return
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      const openWrap = document.querySelector('[data-status-picker="open"]')
      const menuEl = document.querySelector('[data-status-picker-menu]')
      const outsideAnchor = !openWrap?.contains(target)
      const outsideMenu = !menuEl?.contains(target)
      if (outsideAnchor && outsideMenu) {
        setStatusPickerLineId(null)
        setPickerAnchorEl(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStatusPickerLineId(null)
        setPickerAnchorEl(null)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [statusPickerLineId])

  useEffect(() => {
    if (sidebarLocationId === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarLocationId(null)
        setStatusPickerLineId(null)
        setPickerAnchorEl(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sidebarLocationId])

  useEffect(() => {
    if (sidebarLocationId === null || !customers) return
    const exists = customers.some((c) => c.locations.some((l) => l.id === sidebarLocationId))
    if (!exists) {
      setSidebarLocationId(null)
      setStatusPickerLineId(null)
      setPickerAnchorEl(null)
    }
  }, [sidebarLocationId, customers])

  const sidebarContext = useMemo(() => {
    if (!customers || sidebarLocationId === null) return null
    for (const c of customers) {
      const loc = c.locations.find((l) => l.id === sidebarLocationId)
      if (loc) return { customer: c, location: loc }
    }
    return null
  }, [customers, sidebarLocationId])

  const statusPickerLine = useMemo(() => {
    if (statusPickerLineId === null || !sidebarContext?.location.schedule) return null
    return sidebarContext.location.schedule.find((l) => l.id === statusPickerLineId) ?? null
  }, [statusPickerLineId, sidebarContext])

  const onSubmit = (data: DialogFormValues) => {
    if (dialog === 'add') {
      createMutation.mutate(data)
    } else if (dialog === 'edit' && editing) {
      saveEditMutation.mutate({
        ...data,
        customerId: editing.customer.id,
        locationId: editing.location.id,
      })
    }
  }

  const openAdd = () => {
    setSidebarLocationId(null)
    setStatusPickerLineId(null)
    setPickerAnchorEl(null)
    setEditing(null)
    setDialog('add')
  }

  const openEdit = (customer: ServiceCustomer, location: ServiceLocation) => {
    setSidebarLocationId(null)
    setStatusPickerLineId(null)
    setPickerAnchorEl(null)
    setEditing({ customer, location })
    setDialog('edit')
  }

  const openScheduleSidebar = (locationId: number) => {
    setStatusPickerLineId(null)
    setPickerAnchorEl(null)
    setSidebarLocationId((id) => (id === locationId ? null : locationId))
  }

  const closeScheduleSidebar = () => {
    setSidebarLocationId(null)
    setStatusPickerLineId(null)
    setPickerAnchorEl(null)
  }

  const closeDialog = () => {
    setDialog(null)
    setEditing(null)
  }

  const handleDeleteLocation = (customer: ServiceCustomer, location: ServiceLocation) => {
    if (!window.confirm(`Remove “${location.label}” for ${customer.name}?`)) return
    deleteLocationMutation.mutate(location.id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">Regular Service</h1>
        <p className="mt-1 text-sm text-muted-foreground md:mt-2">
          One row per service site — customers can have multiple locations with separate schedules.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b">
          <div>
            <CardTitle>Service schedule</CardTitle>
            <CardDescription>Last and next visit dates per location.</CardDescription>
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
          {!isLoading && flatRows.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="max-w-[180px]">Service</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Last service</TableHead>
                    <TableHead>Next service</TableHead>
                    <TableHead className="max-w-[140px]">Notes</TableHead>
                    <TableHead className="w-[130px]">Service list</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flatRows.map(({ customer: c, location: loc }) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{loc.label}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {loc.service_description || '—'}
                      </TableCell>
                      <TableCell>{loc.frequency}</TableCell>
                      <TableCell>{loc.last_service || '—'}</TableCell>
                      <TableCell>{loc.next_service || '—'}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground max-w-[140px]">
                        {loc.notes || '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant={sidebarLocationId === loc.id ? 'secondary' : 'outline'}
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openScheduleSidebar(loc.id)}
                          aria-expanded={sidebarLocationId === loc.id}
                          aria-controls="schedule-sidebar-panel"
                        >
                          <CalendarRange className="size-3.5 shrink-0" />
                          <span className="hidden sm:inline">Service list</span>
                          <span className="sm:hidden">List</span>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Edit ${loc.label}`}
                            onClick={() => openEdit(c, loc)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive hover:text-destructive"
                            aria-label={`Remove ${loc.label}`}
                            onClick={() => handleDeleteLocation(c, loc)}
                            disabled={deleteLocationMutation.isPending}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {sidebarLocationId !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden
            onClick={closeScheduleSidebar}
          />
          <aside
            id="schedule-sidebar-panel"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-sidebar-title"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContext && (
              <>
                <div className="flex shrink-0 items-start justify-between gap-4 border-b px-4 py-4">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {sidebarContext.customer.name}
                    </p>
                    <h2 id="schedule-sidebar-title" className="text-lg font-semibold leading-tight">
                      {sidebarContext.location.label}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sidebarContext.location.service_description || 'No description'}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {sidebarContext.location.frequency}
                      {sidebarContext.location.last_service && ` · Last: ${sidebarContext.location.last_service}`}
                      {sidebarContext.location.next_service && ` · Next: ${sidebarContext.location.next_service}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={closeScheduleSidebar}
                    aria-label="Close schedule"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Visit schedule
                  </p>
                  {!sidebarContext.location.schedule?.length ? (
                    <p className="text-sm text-muted-foreground">No scheduled visits yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {sidebarContext.location.schedule.map((line) => {
                        const displayStatus = effectiveScheduleStatus(line.status, line.visit_date, soonCutoffIso)
                        const displayLabel =
                          scheduleStatusOptions.find((o) => o.value === displayStatus)?.label ?? displayStatus
                        return (
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
                                  scheduleStatusBadgeClass(displayStatus),
                                  'h-6 min-h-6 cursor-pointer px-2.5 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
                                )}
                                onClick={(ev) => {
                                  if (statusPickerLineId === line.id) {
                                    setStatusPickerLineId(null)
                                    setPickerAnchorEl(null)
                                  } else {
                                    setStatusPickerLineId(line.id)
                                    setPickerAnchorEl(ev.currentTarget)
                                  }
                                }}
                                disabled={
                                  updateScheduleStatusMutation.isPending &&
                                  updateScheduleStatusMutation.variables?.lineId === line.id
                                }
                                aria-expanded={statusPickerLineId === line.id}
                                aria-haspopup="listbox"
                                aria-label={`Status: ${displayLabel}. Change status`}
                              >
                                {displayLabel}
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
                <div className="shrink-0 border-t p-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    disabled={addLocationMutation.isPending}
                    onClick={() => {
                      const n = sidebarContext.customer.locations.length + 1
                      addLocationMutation.mutate({
                        customerId: sidebarContext.customer.id,
                        label: `Location ${n}`,
                      })
                    }}
                  >
                    <MapPin className="size-4" />
                    Add another location
                  </Button>
                </div>
              </>
            )}
          </aside>
          {sidebarContext && statusPickerLine && pickerAnchorEl && (
            <FloatingScheduleStatusMenu
              anchorEl={pickerAnchorEl}
              line={statusPickerLine}
              options={scheduleStatusOptions}
              onSelect={(status) =>
                updateScheduleStatusMutation.mutate({ lineId: statusPickerLine.id, status })
              }
            />
          )}
        </>
      )}

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
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="service-dialog-title" className="text-lg font-semibold">
              {dialog === 'add' ? 'Add customer' : 'Edit location'}
            </h2>
            {dialog === 'edit' && editing && (
              <p className="mt-1 text-sm text-muted-foreground">{editing.customer.name}</p>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Customer name</label>
                <input
                  {...register('customerName')}
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    errors.customerName && 'border-destructive'
                  )}
                />
                {errors.customerName && (
                  <p className="mt-1 text-xs text-destructive">{errors.customerName.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Customer notes</label>
                <textarea
                  {...register('customerNotes')}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Account-level notes (optional)"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Location label</label>
                <input
                  {...register('label')}
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    errors.label && 'border-destructive'
                  )}
                />
                {errors.label && <p className="mt-1 text-xs text-destructive">{errors.label.message}</p>}
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
                <Select
                  value={frequency}
                  onValueChange={(v) => setValue('frequency', v as DialogFormValues['frequency'])}
                >
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
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Location notes</label>
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
                  disabled={createMutation.isPending || saveEditMutation.isPending}
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
