import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { QuarterRecord } from '@/types/finance'

export function QuarterComparison() {
  const { data: quarters, isLoading } = useQuery({
    queryKey: ['quarters'],
    queryFn: async () => {
      const response = await fetch('/api/quarters')
      if (!response.ok) throw new Error('Failed to fetch quarters')
      return response.json() as Promise<QuarterRecord[]>
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quarter Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading quarters...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!quarters || quarters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quarter Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No quarters saved yet. Save a quarter to get started.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = quarters.map((q) => ({
    label: q.label,
    income: q.pl_summary.totalIncome,
    expenses: q.pl_summary.totalExpenses,
    profit: q.pl_summary.netProfit,
  }))

  const chartConfig = {
    income: { label: 'Income', color: '#10b981' },
    expenses: { label: 'Expenses', color: '#ef4444' },
    profit: { label: 'Net Profit', color: '#3b82f6' },
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Quarter Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                  }
                  return value
                }}
              />
              <Legend />
              <Bar dataKey="income" fill={chartConfig.income.color} />
              <Bar dataKey="expenses" fill={chartConfig.expenses.color} />
              <Bar dataKey="profit" fill={chartConfig.profit.color} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-6 rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="px-4 py-2 text-left">Quarter</th>
                <th className="px-4 py-2 text-right">Income</th>
                <th className="px-4 py-2 text-right">Expenses</th>
                <th className="px-4 py-2 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q) => (
                <tr key={q.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-2">{q.label}</td>
                  <td className="px-4 py-2 text-right text-green-600">
                    ${q.pl_summary.totalIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-right text-red-600">
                    ${q.pl_summary.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      q.pl_summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}
                  >
                    ${q.pl_summary.netProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
