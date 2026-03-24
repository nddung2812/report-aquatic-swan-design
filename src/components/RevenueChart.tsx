import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import type { MonthlySummary } from '@/types/finance'

interface RevenueChartProps {
  data: MonthlySummary[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: '#10b981',
    },
    expenses: {
      label: 'Expenses',
      color: '#ef4444',
    },
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Monthly Revenue vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill={chartConfig.revenue.color} />
            <Bar dataKey="expenses" fill={chartConfig.expenses.color} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
