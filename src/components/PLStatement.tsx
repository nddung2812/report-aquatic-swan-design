import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PLStatement } from '@/types/finance'

interface PLStatementProps {
  statement: PLStatement
}

export function PLStatementComponent({ statement }: PLStatementProps) {
  // Group by category
  const byCategory = new Map<
    string,
    { income: number; expense: number }
  >()

  for (const item of statement.byCategory) {
    if (!byCategory.has(item.category)) {
      byCategory.set(item.category, { income: 0, expense: 0 })
    }
    const cat = byCategory.get(item.category)!
    if (item.type === 'income') {
      cat.income += item.amount
    } else {
      cat.expense += item.amount
    }
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Profit & Loss Statement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                ${statement.totalIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                ${statement.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div
              className={`rounded-lg p-4 ${
                statement.netProfit >= 0
                  ? 'bg-blue-50 dark:bg-blue-950'
                  : 'bg-orange-50 dark:bg-orange-950'
              }`}
            >
              <p className="text-sm text-muted-foreground">Net Profit/Loss</p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  statement.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}
              >
                {statement.netProfit >= 0 ? '+' : '-'}$
                {Math.abs(statement.netProfit).toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* By Category Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(byCategory.entries()).map(([category, amounts]) => {
                  const net = amounts.income - amounts.expense
                  return (
                    <TableRow key={category}>
                      <TableCell className="font-medium">{category.replace(/^Sales - /i, '')}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {amounts.income > 0
                          ? `$${amounts.income.toLocaleString('en-US', {
                              maximumFractionDigits: 2,
                            })}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {amounts.expense > 0
                          ? `$${amounts.expense.toLocaleString('en-US', {
                              maximumFractionDigits: 2,
                            })}`
                          : '-'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          net >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {net >= 0 ? '+' : '-'}$
                        {Math.abs(net).toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
