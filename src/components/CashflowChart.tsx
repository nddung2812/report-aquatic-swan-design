import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Transaction } from '@/types/finance'

interface CashflowChartProps {
  transactions: Transaction[]
}

export function CashflowChart({ transactions }: CashflowChartProps) {
  // Sort by date and prepare chart data
  const sortedTxns = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  const chartData = sortedTxns.map((txn) => ({
    date: new Date(txn.date).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
    }),
    balance: txn.balance,
    fullDate: txn.date,
  }))

  const chartConfig = {
    balance: {
      label: 'Cash Balance',
      color: '#3b82f6',
    },
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Cashflow Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                style={{ color: 'var(--text-muted)' }}
              />
              <YAxis tick={{ fontSize: 12 }} style={{ color: 'var(--text-muted)' }} />
              <Tooltip
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                  }
                  return value
                }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke={chartConfig.balance.color}
                dot={{ fill: chartConfig.balance.color }}
                strokeWidth={2}
                name="Cash Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
