import { FileBarChart2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuarterComparison } from '@/components/QuarterComparison'

const quarterSelectorSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),
})

type QuarterSelectorFormData = z.infer<typeof quarterSelectorSchema>

export interface SelectedQuarter {
  year: number
  quarter: number
}

interface SavedQuarterSummary {
  id: number
  label: string
  year: number
  quarter: number
  created_at: string
  pl_summary: { totalIncome: number; totalExpenses: number; netProfit: number }
  cashChange: number
}

interface QuarterSelectorProps {
  onSelect: (quarter: SelectedQuarter) => void
  onLoadSaved: (id: number, year: number, quarter: number) => void
}

const currentYear = new Date().getFullYear()
const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

export function QuarterSelector({ onSelect, onLoadSaved }: QuarterSelectorProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuarterSelectorFormData>({
    resolver: zodResolver(quarterSelectorSchema) as any,
    defaultValues: {
      year: currentYear,
      quarter: currentQuarter,
    },
  })

  const { data: savedQuarters, isLoading } = useQuery({
    queryKey: ['quarters'],
    queryFn: async () => {
      const response = await fetch('/api/quarters')
      if (!response.ok) throw new Error('Failed to fetch quarters')
      return response.json() as Promise<SavedQuarterSummary[]>
    },
  })

  const handleSelect = (data: QuarterSelectorFormData) => {
    onSelect({ year: data.year, quarter: data.quarter })
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_340px]">

          {/* Left: Saved quarters grid */}
          <div className="grid grid-cols-2 gap-3 content-start">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading saved quarters...</p>
            )}
            {!isLoading && savedQuarters && savedQuarters.length === 0 && (
              <p className="text-sm text-muted-foreground">No saved reports yet. Enter a quarter to get started.</p>
            )}
            {savedQuarters && savedQuarters.map((q) => (
              <button
                key={q.id}
                onClick={() => onLoadSaved(q.id, q.year, q.quarter)}
                className="group w-full cursor-pointer rounded-lg border bg-background px-3 py-2.5 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <FileBarChart2 className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-semibold">{q.label}</span>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span>In: ${q.pl_summary.totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      <span>Ex: ${q.pl_summary.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${q.pl_summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {q.pl_summary.netProfit >= 0 ? '+' : ''}${q.pl_summary.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-xs ${q.cashChange >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {q.cashChange >= 0 ? '+' : ''}${q.cashChange.toLocaleString('en-US', { maximumFractionDigits: 0 })} cash
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Enter New Quarter form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Enter New Quarter</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Which quarter are you entering data for?
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleSelect)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium mb-2">
                        Year
                      </label>
                      <select
                        id="year"
                        {...register('year')}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      {errors.year && (
                        <p className="mt-1 text-sm text-destructive">{errors.year.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="quarter" className="block text-sm font-medium mb-2">
                        Quarter
                      </label>
                      <select
                        id="quarter"
                        {...register('quarter')}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="1">Q1 (Jan-Mar)</option>
                        <option value="2">Q2 (Apr-Jun)</option>
                        <option value="3">Q3 (Jul-Sep)</option>
                        <option value="4">Q4 (Oct-Dec)</option>
                      </select>
                      {errors.quarter && (
                        <p className="mt-1 text-sm text-destructive">{errors.quarter.message}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Continue
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Analytics below the reports */}
        <div className="mt-8">
          <QuarterComparison />
        </div>
      </div>
    </div>
  )
}
