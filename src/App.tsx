import { useState } from 'react'
import { Power, Home, BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SummaryCards } from '@/components/SummaryCards'
import { CashflowChart } from '@/components/CashflowChart'
import { TransactionsTable } from '@/components/TransactionsTable'
import { LoginPage } from '@/components/LoginPage'
import { QuarterSelector, type SelectedQuarter } from '@/components/QuarterSelector'
import { CashSourcesForm } from '@/components/CashSourcesForm'
import { CsvUpload } from '@/components/CsvUpload'
import { PLStatementComponent } from '@/components/PLStatement'
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
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" className="h-7 w-7">
      <defs>
        <linearGradient id="cba-tx-lg1" x1="13.22" y1="-130.02" x2="50.78" y2="-161.53" gradientTransform="matrix(1,0,0,-1,0,-113.78)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff0"/>
          <stop offset="0.27" stopColor="#fef10c"/>
          <stop offset="0.45" stopColor="#fde516"/>
          <stop offset="0.64" stopColor="#fde113"/>
          <stop offset="0.82" stopColor="#fed508"/>
          <stop offset="0.92" stopColor="#fc0"/>
        </linearGradient>
        <linearGradient id="cba-tx-lg2" x1="38.93" y1="-154.54" x2="50.6" y2="-161.84" gradientTransform="matrix(1,0,0,-1,0,-113.78)" gradientUnits="userSpaceOnUse">
          <stop offset="0.1" stopColor="#874400"/>
          <stop offset="0.26" stopColor="#d88a00"/>
          <stop offset="0.37" stopColor="#e79d00"/>
          <stop offset="0.52" stopColor="#f2b400"/>
          <stop offset="0.7" stopColor="#fad202"/>
          <stop offset="0.9" stopColor="#fedf03"/>
        </linearGradient>
      </defs>
      <polyline fill="url(#cba-tx-lg1)" points="32 0 64 32 32 64 0 32 32 0"/>
      <polygon fill="url(#cba-tx-lg2)" points="44.15 35.24 32 64 32 64 64 32 55.69 23.68 44.15 35.24"/>
    </svg>
  ),
  commbank_saver: (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" className="h-7 w-7">
      <defs>
        <linearGradient id="cba-sv-lg1" x1="13.22" y1="-130.02" x2="50.78" y2="-161.53" gradientTransform="matrix(1,0,0,-1,0,-113.78)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff0"/>
          <stop offset="0.27" stopColor="#fef10c"/>
          <stop offset="0.45" stopColor="#fde516"/>
          <stop offset="0.64" stopColor="#fde113"/>
          <stop offset="0.82" stopColor="#fed508"/>
          <stop offset="0.92" stopColor="#fc0"/>
        </linearGradient>
        <linearGradient id="cba-sv-lg2" x1="38.93" y1="-154.54" x2="50.6" y2="-161.84" gradientTransform="matrix(1,0,0,-1,0,-113.78)" gradientUnits="userSpaceOnUse">
          <stop offset="0.1" stopColor="#874400"/>
          <stop offset="0.26" stopColor="#d88a00"/>
          <stop offset="0.37" stopColor="#e79d00"/>
          <stop offset="0.52" stopColor="#f2b400"/>
          <stop offset="0.7" stopColor="#fad202"/>
          <stop offset="0.9" stopColor="#fedf03"/>
        </linearGradient>
      </defs>
      <polyline fill="url(#cba-sv-lg1)" points="32 0 64 32 32 64 0 32 32 0"/>
      <polygon fill="url(#cba-sv-lg2)" points="44.15 35.24 32 64 32 64 64 32 55.69 23.68 44.15 35.24"/>
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
  const [loadedQuarterId, setLoadedQuarterId] = useState<number | null>(null)
  const [cashSources, setCashSources] = useState<CashSource[] | null>(null)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [activeTab, setActiveTab] = useState<'current' | 'compare'>('current')
  const [loadingQuarter, setLoadingQuarter] = useState(false)
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ opening: string; closing: string }>({ opening: '', closing: '' })

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
      setLoadedQuarterId(id)
      setCashSources(data.cash_sources)
      setTransactions(data.transactions.map((t: Transaction) => ({
        ...t,
        category: categorizeTransaction(t.description),
      })))
      setActiveTab('current')
    } finally {
      setLoadingQuarter(false)
    }
  }

  const goHome = () => {
    setSelectedQuarter(null)
    setLoadedQuarterId(null)
    setCashSources(null)
    setTransactions(null)
    setActiveTab('current')
    setLoadingQuarter(false)
    setEditingSourceId(null)
  }

  const handleStartEdit = (source: CashSource) => {
    setEditingSourceId(source.id)
    setEditValues({ opening: String(source.openingBalance), closing: String(source.closingBalance) })
  }

  const handleSaveEdit = async () => {
    if (!editingSourceId) return
    const updatedSources = cashSources!.map(s =>
      s.id === editingSourceId
        ? { ...s, openingBalance: parseFloat(editValues.opening) || 0, closingBalance: parseFloat(editValues.closing) || 0 }
        : s
    )
    setCashSources(updatedSources)
    setEditingSourceId(null)

    if (loadedQuarterId) {
      await fetch(`/api/quarters/${loadedQuarterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cash_sources: updatedSources }),
      })
    }
  }

  const quarterLabel = selectedQuarter
    ? `Q${selectedQuarter.quarter} ${selectedQuarter.year}`
    : null
  const hasData = cashSources && transactions

  return (
    <div className="min-h-screen bg-background">
      {/* Global Nav */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <button
            onClick={goHome}
            className="flex items-center gap-2 font-semibold hover:text-primary transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Finance Report</span>
          </button>

          <div className="flex items-center gap-3">
            {quarterLabel && (
              <>
                <button
                  onClick={goHome}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </button>
                <span className="text-sm font-medium text-muted-foreground">{quarterLabel}</span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              <Power className="h-4 w-4" />
              <span className="hidden md:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Loading skeleton */}
        {loadingQuarter && (
          <div className="space-y-6">
            {/* Page header */}
            <div className="space-y-2">
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-4 w-24" />
            </div>
            {/* Cash sources grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            {/* Chart */}
            <Skeleton className="h-64 w-full rounded-lg" />
            {/* Tabs */}
            <div className="flex gap-2 border-b pb-0">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-36" />
            </div>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            {/* P&L table */}
            <Skeleton className="h-48 w-full rounded-lg" />
            {/* Transactions table */}
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        )}

        {/* Quarter Selector */}
        {!loadingQuarter && !selectedQuarter && (
          <QuarterSelector onSelect={setSelectedQuarter} onLoadSaved={handleLoadSaved} />
        )}

        {/* Report */}
        {!loadingQuarter && selectedQuarter && (
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-4xl">Cashflow & P&L Report</h1>
              <p className="mt-1 text-sm text-muted-foreground md:mt-2">
                <span className="font-semibold text-foreground">{quarterLabel}</span>
              </p>
            </div>

        {/* Step 2: Cash Sources Form */}
        {!cashSources ? (
          <div className="space-y-6">
            <CashSourcesForm onSubmit={setCashSources} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cash Sources Summary */}
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {cashSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => editingSourceId === source.id ? setEditingSourceId(null) : handleStartEdit(source)}
                    className={`flex flex-col items-center gap-2 rounded-lg border bg-card px-3 py-4 text-center transition-all hover:border-primary hover:bg-primary/5 ${editingSourceId === source.id ? 'border-primary bg-primary/5' : ''}`}
                  >
                    {accountLogos[source.id]}
                    <div>
                      <p className="text-xs text-muted-foreground">{source.label}</p>
                      <p className="text-sm font-semibold">
                        ${source.closingBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Inline Edit Panel */}
              {editingSourceId && (() => {
                const source = cashSources.find(s => s.id === editingSourceId)!
                return (
                  <div className="mt-3 rounded-lg border bg-muted/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">{source.label}</p>
                      <button
                        onClick={() => setEditingSourceId(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Opening Balance</label>
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.opening}
                            onChange={(e) => setEditValues(v => ({ ...v, opening: e.target.value }))}
                            className="ml-1 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Closing Balance</label>
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.closing}
                            onChange={(e) => setEditValues(v => ({ ...v, closing: e.target.value }))}
                            className="ml-1 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleSaveEdit}
                      className="mt-3 w-full rounded-md bg-primary py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* Cashflow Chart — full width, shown once transactions are loaded */}
            {hasData && <CashflowChart transactions={transactions} />}

            {/* Step 2: CSV Upload */}
            {!transactions ? (
              <CsvUpload onUpload={setTransactions} />
            ) : (
              <div className="space-y-6">
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
                        <SummaryCards
                          cashSources={cashSources}
                          transactions={transactions}
                        />
                        <PLStatementComponent
                          statement={calculatePLStatement(transactions)}
                        />
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
        )}
      </div>
    </div>
  )
}

export default App
