import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface QuarterData {
  id: number
  label: string
  year: number
  quarter: number
  income: number
  expenses: number
  profit: number
  opening: number
  closing: number
}

interface MonthData {
  month: string
  label: string
  income: number
  expenses: number
  profit: number
}

interface AnalyticsData {
  quarterly: QuarterData[]
  monthly: MonthData[]
}

const fmt = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooltipFormatter = (value: any) =>
  typeof value === 'number' ? fmt(value) : String(value ?? '')

export function QuarterComparison() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    )
  }

  if (!data || data.quarterly.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No saved quarters yet.</p>
        </CardContent>
      </Card>
    )
  }

  const { quarterly, monthly } = data

  const totalRevenue = quarterly.reduce((s, q) => s + q.income, 0)
  const totalExpenses = quarterly.reduce((s, q) => s + q.expenses, 0)
  const bestQuarter = quarterly.reduce((best, q) => q.profit > best.profit ? q : best, quarterly[0])
  const avgProfit = quarterly.reduce((s, q) => s + q.profit, 0) / quarterly.length

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-green-600">{fmt(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">All quarters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-red-600">{fmt(totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">All quarters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Best Quarter</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-blue-600">{fmt(bestQuarter.profit)}</p>
            <p className="text-xs text-muted-foreground">{bestQuarter.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Quarterly Profit</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-xl font-bold ${avgProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {fmt(avgProfit)}
            </p>
            <p className="text-xs text-muted-foreground">Per quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quarterly Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quarterly} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" name="Net Profit" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quarterly Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quarter Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-3 text-left font-medium">Quarter</th>
                  <th className="px-4 py-3 text-right font-medium">Income</th>
                  <th className="px-4 py-3 text-right font-medium">Expenses</th>
                  <th className="px-4 py-3 text-right font-medium">Net Profit</th>
                  <th className="px-4 py-3 text-right font-medium">Opening Cash</th>
                  <th className="px-4 py-3 text-right font-medium">Closing Cash</th>
                  <th className="px-4 py-3 text-right font-medium">Cash Change</th>
                </tr>
              </thead>
              <tbody>
                {[...quarterly].reverse().map((q) => {
                  const change = q.closing - q.opening
                  return (
                    <tr key={q.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{q.label}</td>
                      <td className="px-4 py-3 text-right text-green-600">{fmt(q.income)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{fmt(q.expenses)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${q.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {q.profit >= 0 ? '+' : ''}{fmt(q.profit)}
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(q.opening)}</td>
                      <td className="px-4 py-3 text-right">{fmt(q.closing)}</td>
                      <td className={`px-4 py-3 text-right ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{fmt(change)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
