import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Transaction } from '@/types/finance'

interface SummaryCardsProps {
  transactions: Transaction[]
}

export function SummaryCards({ transactions }: SummaryCardsProps) {
  const revenue = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netProfit = revenue - expenses

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <div className="text-2xl font-bold text-green-600">↑</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${revenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Income from all sources</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <div className="text-2xl font-bold text-red-600">↓</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${expenses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">All expenditures</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <div
            className={`text-2xl font-bold ${
              netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {netProfit >= 0 ? '+' : '-'}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ${Math.abs(netProfit).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
        </CardContent>
      </Card>
    </div>
  )
}
