import { useState } from 'react'
import { SummaryCards } from '@/components/SummaryCards'
import { CashflowChart } from '@/components/CashflowChart'
import { TransactionsTable } from '@/components/TransactionsTable'
import { LoginPage } from '@/components/LoginPage'
import { CashSourcesForm } from '@/components/CashSourcesForm'
import { CsvUpload } from '@/components/CsvUpload'
import { PLStatementComponent } from '@/components/PLStatement'
import { calculatePLStatement } from '@/lib/finance'
import type { CashSource, Transaction } from '@/types/finance'

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cashSources, setCashSources] = useState<CashSource[] | null>(null)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  const hasData = cashSources && transactions

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Cashflow & P&L Report</h1>
            <p className="mt-2 text-muted-foreground">
              Track your business cash position and profit & loss
            </p>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Log out
          </button>
        </div>

        {/* Step 1: Cash Sources Form */}
        {!cashSources ? (
          <div className="space-y-6">
            <CashSourcesForm onSubmit={setCashSources} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cash Sources Summary */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-medium">Cash Sources Entered</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                {cashSources.map((source) => (
                  <div key={source.id} className="rounded bg-muted p-2">
                    <p className="text-xs text-muted-foreground">{source.label}</p>
                    <p className="text-sm font-semibold">
                      ${source.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setCashSources(null)}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Edit
              </button>
            </div>

            {/* Step 2: CSV Upload */}
            {!transactions ? (
              <CsvUpload onUpload={setTransactions} />
            ) : (
              <div className="space-y-6">
                {/* Transactions Summary */}
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-sm font-medium">CSV Imported</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {transactions.length} transactions parsed
                  </p>
                  <button
                    onClick={() => setTransactions(null)}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    Upload different file
                  </button>
                </div>

                {/* Report */}
                {hasData && (
                  <div className="grid gap-6">
                    <SummaryCards
                      cashSources={cashSources}
                      transactions={transactions}
                    />
                    <PLStatementComponent
                      statement={calculatePLStatement(transactions)}
                    />
                    <CashflowChart transactions={transactions} />
                    <TransactionsTable transactions={transactions} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
