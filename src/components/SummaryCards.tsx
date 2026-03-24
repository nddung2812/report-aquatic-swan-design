import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CashSource, Transaction } from '@/types/finance'
import { calculateTotalOpening, calculateTotalClosing, calculateNetCashChange } from '@/lib/finance'

interface SummaryCardsProps {
  cashSources: CashSource[]
  transactions: Transaction[]
}

export function SummaryCards({ cashSources, transactions }: SummaryCardsProps) {
  const totalOpening = calculateTotalOpening(cashSources)
  const totalClosing = calculateTotalClosing(cashSources)
  const netCashChange = calculateNetCashChange(cashSources)

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netProfit = totalIncome - totalExpenses

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Opening Cash</CardTitle>
          <div className="text-lg">📊</div>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            ${totalOpening.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">Quarter start</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Closing Cash</CardTitle>
          <div className="text-lg">💰</div>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            ${totalClosing.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">Quarter end</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash Change</CardTitle>
          <div className={`text-lg ${netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netCashChange >= 0 ? '📈' : '📉'}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-lg font-bold ${netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netCashChange >= 0 ? '+' : ''}${netCashChange.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">Closing - Opening</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <div className="text-lg text-green-600">↑</div>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            ${totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">From all sources</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <div className="text-lg text-red-600">↓</div>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            ${totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">All expenditures</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <div className={`text-lg ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {netProfit >= 0 ? '✓' : '✗'}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-lg font-bold ${
              netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}
          >
            {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">Income - Expenses</p>
        </CardContent>
      </Card>
    </div>
  )
}
