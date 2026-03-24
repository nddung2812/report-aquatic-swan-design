import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SummaryCards } from '@/components/SummaryCards'
import { RevenueChart } from '@/components/RevenueChart'
import { TransactionsTable } from '@/components/TransactionsTable'
import { LoginPage } from '@/components/LoginPage'
import { mockTransactions, mockMonthlySummary } from '@/data/mockData'

// Simulated async data fetchers
const fetchTransactions = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockTransactions
}

const fetchMonthlySummary = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockMonthlySummary
}

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const {
    data: transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  })

  const {
    data: monthlySummary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ['monthly'],
    queryFn: fetchMonthlySummary,
  })

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  if (transactionsError || summaryError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error loading data</h1>
          <p className="text-muted-foreground">
            Please try again later.
          </p>
        </div>
      </div>
    )
  }

  const isLoading = transactionsLoading || summaryLoading

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Finance Report</h1>
            <p className="mt-2 text-muted-foreground">
              Overview of your revenue, expenses, and transactions
            </p>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Log out
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {transactions && <SummaryCards transactions={transactions} />}
            {monthlySummary && <RevenueChart data={monthlySummary} />}
            {transactions && <TransactionsTable transactions={transactions} />}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
