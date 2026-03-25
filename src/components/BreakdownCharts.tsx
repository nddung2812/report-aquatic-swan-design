import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Transaction } from '@/types/finance'

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
]

interface BreakdownChartsProps {
  transactions: Transaction[]
}

function buildSlices(transactions: Transaction[], type: 'income' | 'expense') {
  const totals: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type !== type) continue
    totals[t.category] = (totals[t.category] ?? 0) + t.amount
  }
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

const formatCurrency = (v: number) =>
  `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export function BreakdownCharts({ transactions }: BreakdownChartsProps) {
  const incomeSlices = buildSlices(transactions, 'income')
  const expenseSlices = buildSlices(transactions, 'expense')

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={incomeSlices}
                cx="50%"
                cy="45%"
                outerRadius={90}
                dataKey="value"
                nameKey="name"
              >
                {incomeSlices.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={expenseSlices}
                cx="50%"
                cy="45%"
                outerRadius={90}
                dataKey="value"
                nameKey="name"
              >
                {expenseSlices.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
