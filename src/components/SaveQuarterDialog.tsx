import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CashSource, Transaction, PLStatement } from '@/types/finance'

const saveQuarterSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  year: z.coerce.number().int().min(2000),
  quarter: z.coerce.number().int().min(1).max(4),
})

type SaveQuarterFormData = z.infer<typeof saveQuarterSchema>

interface SaveQuarterDialogProps {
  cashSources: CashSource[]
  transactions: Transaction[]
  plSummary: PLStatement
  onSuccess?: () => void
}

export function SaveQuarterDialog({
  cashSources,
  transactions,
  plSummary,
  onSuccess,
}: SaveQuarterDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SaveQuarterFormData>({
    resolver: zodResolver(saveQuarterSchema) as any,
    defaultValues: {
      label: `Q${new Date().getMonth() > 8 ? 4 : Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
      year: new Date().getFullYear(),
      quarter: Math.floor(new Date().getMonth() / 3) + 1,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: SaveQuarterFormData) => {
      const response = await fetch('/api/quarters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          cash_sources: cashSources,
          transactions,
          pl_summary: plSummary,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save quarter')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quarters'] })
      setIsOpen(false)
      reset()
      onSuccess?.()
    },
  })

  const handleSave = (data: SaveQuarterFormData) => {
    mutation.mutate(data)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Save This Quarter
      </button>
    )
  }

  return (
    <Card className="fixed inset-0 z-50 m-auto h-fit max-w-md">
      <CardHeader>
        <CardTitle>Save Quarter Data</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div>
            <label htmlFor="label" className="block text-sm font-medium">
              Quarter Label
            </label>
            <input
              id="label"
              type="text"
              {...register('label')}
              placeholder="e.g., Q1 2024"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            {errors.label && (
              <p className="mt-1 text-sm text-destructive">{errors.label.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium">
                Year
              </label>
              <input
                id="year"
                type="number"
                {...register('year')}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {errors.year && (
                <p className="mt-1 text-sm text-destructive">{errors.year.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="quarter" className="block text-sm font-medium">
                Quarter
              </label>
              <select
                id="quarter"
                {...register('quarter')}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
              </select>
              {errors.quarter && (
                <p className="mt-1 text-sm text-destructive">{errors.quarter.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-md bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-md border border-input py-2 font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to save'}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
