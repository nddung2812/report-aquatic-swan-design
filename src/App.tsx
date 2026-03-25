import { useState } from 'react'
import { Wallet, CreditCard, Landmark, PiggyBank } from 'lucide-react'
import { SummaryCards } from '@/components/SummaryCards'
import { CashflowChart } from '@/components/CashflowChart'
import { TransactionsTable } from '@/components/TransactionsTable'
import { LoginPage } from '@/components/LoginPage'
import { QuarterSelector, type SelectedQuarter } from '@/components/QuarterSelector'
import { CashSourcesForm } from '@/components/CashSourcesForm'
import { CsvUpload } from '@/components/CsvUpload'
import { PLStatementComponent } from '@/components/PLStatement'
import { SaveQuarterDialog } from '@/components/SaveQuarterDialog'
import { QuarterComparison } from '@/components/QuarterComparison'
import { calculatePLStatement } from '@/lib/finance'
import { categorizeTransaction } from '@/lib/csvParser'
import type { CashSource, Transaction } from '@/types/finance'

const accountIcons: Record<string, React.ReactNode> = {
  paypal: <Wallet className="h-5 w-5" />,
  stripe: <CreditCard className="h-5 w-5" />,
  commbank_transaction: <Landmark className="h-5 w-5" />,
  commbank_saver: <PiggyBank className="h-5 w-5" />,
}

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(import.meta.env.DEV)
  const [selectedQuarter, setSelectedQuarter] = useState<SelectedQuarter | null>(null)
  const [cashSources, setCashSources] = useState<CashSource[] | null>(null)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [activeTab, setActiveTab] = useState<'current' | 'compare'>('current')
  const [loadingQuarter, setLoadingQuarter] = useState(false)
  const [recategorizeMsg, setRecategorizeMsg] = useState<string | null>(null)

  const handleRecategorize = () => {
    if (!transactions) return
    let changed = 0
    const updated = transactions.map((t) => {
      const newCategory = categorizeTransaction(t.description)
      if (newCategory !== t.category) changed++
      return { ...t, category: newCategory }
    })
    setTransactions(updated)
    setRecategorizeMsg(changed > 0 ? `${changed} transaction${changed > 1 ? 's' : ''} updated` : 'No changes — categories already up to date')
    setTimeout(() => setRecategorizeMsg(null), 4000)
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  const handleLoadSaved = async (id: number, year: number, quarter: number) => {
    setLoadingQuarter(true)
    try {
      const response = await fetch(`/api/quarters/${id}`)
      if (!response.ok) throw new Error('Failed to load quarter')
      const data = await response.json()
      setSelectedQuarter({ year, quarter })
      setCashSources(data.cash_sources)
      setTransactions(data.transactions)
      setActiveTab('current')
    } finally {
      setLoadingQuarter(false)
    }
  }

  // Step 1: Select Quarter
  if (!selectedQuarter) {
    if (loadingQuarter) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading quarter...</p>
        </div>
      )
    }
    return <QuarterSelector onSelect={setSelectedQuarter} onLoadSaved={handleLoadSaved} />
  }

  const quarterLabel = `Q${selectedQuarter.quarter} ${selectedQuarter.year}`
  const hasData = cashSources && transactions

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => {
              setSelectedQuarter(null)
              setCashSources(null)
              setTransactions(null)
              setActiveTab('current')
              setLoadingQuarter(false)
            }}
            className="hover:text-foreground hover:underline"
          >
            Home
          </button>
          <span>/</span>
          <span className="font-medium text-foreground">{quarterLabel}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Cashflow & P&L Report</h1>
            <p className="mt-2 text-muted-foreground">
              <span className="font-semibold text-foreground">{quarterLabel}</span>
            </p>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Log out
          </button>
        </div>

        {/* Step 2: Cash Sources Form */}
        {!cashSources ? (
          <div className="space-y-6">
            <CashSourcesForm onSubmit={setCashSources} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cash Sources Summary */}
            <div className="flex flex-wrap items-center gap-3">
              {cashSources.map((source) => (
                <div key={source.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                  <span className="text-muted-foreground">{accountIcons[source.id]}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{source.label}</p>
                    <p className="text-sm font-semibold">
                      ${source.closingBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setCashSources(null)}
                className="text-xs text-muted-foreground hover:underline"
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
                    className="mt-3 text-xs text-muted-foreground hover:underline"
                  >
                    Upload different file
                  </button>
                </div>

                {/* Report */}
                {hasData && (
                  <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2 border-b">
                      <button
                        onClick={() => setActiveTab('current')}
                        className={`px-4 py-2 font-medium ${
                          activeTab === 'current'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Current Quarter
                      </button>
                      <button
                        onClick={() => setActiveTab('compare')}
                        className={`px-4 py-2 font-medium ${
                          activeTab === 'compare'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Compare Quarters
                      </button>
                    </div>

                    {/* Current Quarter Tab */}
                    {activeTab === 'current' && (
                      <div className="grid gap-6">
                        <div className="flex items-center justify-end gap-3">
                          {recategorizeMsg && (
                            <span className="text-sm text-muted-foreground">{recategorizeMsg}</span>
                          )}
                          <button
                            onClick={handleRecategorize}
                            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
                          >
                            Re-categorize
                          </button>
                          <SaveQuarterDialog
                            cashSources={cashSources}
                            transactions={transactions}
                            plSummary={calculatePLStatement(transactions)}
                            selectedQuarter={selectedQuarter}
                          />
                        </div>
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

                    {/* Compare Quarters Tab */}
                    {activeTab === 'compare' && (
                      <div className="grid gap-6">
                        <QuarterComparison />
                      </div>
                    )}
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
