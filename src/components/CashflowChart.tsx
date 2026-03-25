import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Cashflow Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => {
                if (typeof value === 'number') {
                  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                }
                return value
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              dot={{ fill: '#3b82f6' }}
              strokeWidth={2}
              name="Cash Balance"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
