import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { QuarterRecord } from '@/types/finance'
import { calculateTotalOpening, calculateTotalClosing } from '@/lib/finance'

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
    opening: calculateTotalOpening(q.cash_sources),
    closing: calculateTotalClosing(q.cash_sources),
    income: q.pl_summary.totalIncome,
    expenses: q.pl_summary.totalExpenses,
    profit: q.pl_summary.netProfit,
  }))

  const chartConfig = {
    opening: { label: 'Opening Cash', color: '#6366f1' },
    closing: { label: 'Closing Cash', color: '#3b82f6' },
    profit: { label: 'Net Profit', color: '#10b981' },
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
                    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                  }
                  return value
                }}
              />
              <Legend />
              <Bar dataKey="opening" fill={chartConfig.opening.color} />
              <Bar dataKey="closing" fill={chartConfig.closing.color} />
              <Bar dataKey="profit" fill={chartConfig.profit.color} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-6 rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="px-4 py-2 text-left">Quarter</th>
                <th className="px-4 py-2 text-right">Opening Cash</th>
                <th className="px-4 py-2 text-right">Closing Cash</th>
                <th className="px-4 py-2 text-right">Cash Change</th>
                <th className="px-4 py-2 text-right">Income</th>
                <th className="px-4 py-2 text-right">Expenses</th>
                <th className="px-4 py-2 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q) => {
                const opening = calculateTotalOpening(q.cash_sources)
                const closing = calculateTotalClosing(q.cash_sources)
                const change = closing - opening
                return (
                  <tr key={q.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-2 font-medium">{q.label}</td>
                    <td className="px-4 py-2 text-right">
                      ${opening.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${closing.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className={`px-4 py-2 text-right ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '+' : ''}${change.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-2 text-right text-green-600">
                      ${q.pl_summary.totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-2 text-right text-red-600">
                      ${q.pl_summary.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        q.pl_summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}
                    >
                      ${q.pl_summary.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
