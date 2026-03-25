import { FileBarChart2, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">

        {/* Saved quarters */}
        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">Loading saved quarters...</p>
        )}
        {savedQuarters && savedQuarters.length > 0 && (
          <Card>
            <CardContent className="space-y-2 pt-6">
              {savedQuarters.map((q) => (
                <button
                  key={q.id}
                  onClick={() => onLoadSaved(q.id, q.year, q.quarter)}
                  className="group w-full rounded-lg border bg-background px-4 py-4 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FileBarChart2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{q.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${q.pl_summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {q.pl_summary.netProfit >= 0 ? '+' : ''}${q.pl_summary.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </div>
                      <div className="mt-0.5 flex gap-4 text-xs text-muted-foreground">
                        <span>Income: ${q.pl_summary.totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        <span>Expenses: ${q.pl_summary.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* New quarter form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Enter New Quarter</CardTitle>
            <p className="mt-2 text-center text-sm text-muted-foreground">
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
  )
}
