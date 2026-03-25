import { useState } from 'react'
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

const accountLogos: Record<string, React.ReactNode> = {
  paypal: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.477z" fill="#009cde"/>
      <path d="M6.635 7.565a.982.982 0 0 1 .97-.833h6.137c.728 0 1.405.048 2.021.149a8.55 8.55 0 0 1 .98.236 5.29 5.29 0 0 1 1.348.62c.385-2.455-.003-4.12-1.333-5.633C15.467.862 13.114.16 10.05.16H2.595c-.61 0-1.13.445-1.225 1.047L.01 17.62a.737.737 0 0 0 .728.852H5.4l1.235-7.847-.001-.038.001-.027v-.994z" fill="#003087"/>
    </svg>
  ),
  stripe: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="#635bff"/>
    </svg>
  ),
  commbank_transaction: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#FFD200"/>
      <path d="M12 3.5L20.5 12 12 20.5 3.5 12z" fill="#000"/>
      <text x="12" y="15.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#FFD200" fontFamily="sans-serif">CBA</text>
    </svg>
  ),
  commbank_saver: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#FFD200"/>
      <path d="M12 3.5L20.5 12 12 20.5 3.5 12z" fill="#000"/>
      <text x="12" y="15.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#FFD200" fontFamily="sans-serif">CBA</text>
    </svg>
  ),
}

export function App() {
  const AUTH_KEY = 'auth_expiry'
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

  const isAuthValid = () => {
    const expiry = localStorage.getItem(AUTH_KEY)
    if (!expiry) return false
    if (Date.now() > parseInt(expiry)) {
      localStorage.removeItem(AUTH_KEY)
      return false
    }
    return true
  }

  const [isLoggedIn, setIsLoggedIn] = useState(import.meta.env.DEV || isAuthValid())

  const handleLogin = () => {
    localStorage.setItem(AUTH_KEY, String(Date.now() + SEVEN_DAYS))
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY)
    setIsLoggedIn(false)
  }
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
    return <LoginPage onLogin={handleLogin} />
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
            onClick={handleLogout}
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
                  {accountLogos[source.id]}
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
