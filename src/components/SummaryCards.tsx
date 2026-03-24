import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CashSource, Transaction } from '@/types/finance'
import { calculateTotalCashPosition } from '@/lib/finance'

interface SummaryCardsProps {
  cashSources: CashSource[]
  transactions: Transaction[]
}

export function SummaryCards({ cashSources, transactions }: SummaryCardsProps) {
  const totalCash = calculateTotalCashPosition(cashSources)

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netProfit = totalIncome - totalExpenses

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cash Position</CardTitle>
          <div className="text-2xl font-bold text-blue-600">💰</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalCash.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground">Across all accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <div className="text-2xl font-bold text-green-600">↑</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground">From all sources</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <div className="text-2xl font-bold text-red-600">↓</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground">All expenditures</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
          <div
            className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
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
            ${Math.abs(netProfit).toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Income minus expenses</p>
        </CardContent>
      </Card>
    </div>
  )
}
