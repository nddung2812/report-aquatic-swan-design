import { useState, useEffect } from 'react'
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
import { BreakdownCharts } from '@/components/BreakdownCharts'
import { calculatePLStatement, getTransactionsByQuarter } from '@/lib/finance'
import { categorizeTransaction } from '@/lib/csvParser'
import { accountLogos } from '@/lib/accountLogos'
import type { CashSource, Transaction } from '@/types/finance'

export function App() {
  const AUTH_KEY = 'auth_expiry'
  const LAST_QUARTER_KEY = 'last_quarter_id'
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
  const [loadingQuarter, setLoadingQuarter] = useState(false)
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ opening: string; closing: string }>({ opening: '', closing: '' })

  // Auto-restore last-viewed quarter on page load
  useEffect(() => {
    if (!isLoggedIn) return
    const savedId = localStorage.getItem(LAST_QUARTER_KEY)
    if (!savedId) return
    const id = parseInt(savedId)
    if (isNaN(id)) return
    setLoadingQuarter(true)
    fetch(`/api/quarters/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { localStorage.removeItem(LAST_QUARTER_KEY); return }
        setSelectedQuarter({ year: data.year, quarter: data.quarter })
        setLoadedQuarterId(id)
        setCashSources(data.cash_sources)
        const txns = data.transactions.map((t: Transaction) => ({
          ...t,
          category: t.category || categorizeTransaction(t.description),
        }))
        setTransactions(txns.length > 0 ? txns : null)
      })
      .catch(() => localStorage.removeItem(LAST_QUARTER_KEY))
      .finally(() => setLoadingQuarter(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

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
      const txns = data.transactions.map((t: Transaction) => ({
        ...t,
        category: t.category || categorizeTransaction(t.description),
      }))
      setTransactions(txns.length > 0 ? txns : null)
      localStorage.setItem(LAST_QUARTER_KEY, String(id))
    } finally {
      setLoadingQuarter(false)
    }
  }

  const goHome = () => {
    setSelectedQuarter(null)
    setLoadedQuarterId(null)
    setCashSources(null)
    setTransactions(null)
    setLoadingQuarter(false)
    setEditingSourceId(null)
    localStorage.removeItem(LAST_QUARTER_KEY)
  }

  const handleStartEdit = (source: CashSource) => {
    setEditingSourceId(source.id)
    setEditValues({ opening: String(source.openingBalance), closing: String(source.closingBalance) })
  }

  const handleCategoryChange = async (transactionId: string, category: string) => {
    setTransactions(prev => prev!.map(t => t.id === transactionId ? { ...t, category } : t))
    const numId = parseInt(transactionId)
    if (!isNaN(numId)) {
      await fetch(`/api/transactions/${numId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
    }
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
            {hasData && <BreakdownCharts transactions={transactions} />}

            {/* Step 2: CSV Upload */}
            {!transactions ? (
              <CsvUpload onUpload={async (txns) => {
                const filtered = getTransactionsByQuarter(txns, selectedQuarter!.quarter, selectedQuarter!.year)
                setTransactions(filtered)

                let quarterId = loadedQuarterId

                // If no loaded quarter ID, check if one already exists in the DB
                if (!quarterId) {
                  const listRes = await fetch('/api/quarters')
                  const list = await listRes.json()
                  const match = list.find((q: { id: number; year: number; quarter: number }) =>
                    q.year === selectedQuarter!.year && q.quarter === selectedQuarter!.quarter
                  )
                  if (match) {
                    quarterId = match.id
                    setLoadedQuarterId(match.id)
                  }
                }

                if (quarterId) {
                  await fetch(`/api/quarters/${quarterId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactions: filtered, cash_sources: cashSources }),
                  })
                  // Reload so transaction rows have DB integer IDs (needed for category editing)
                  const reloaded = await fetch(`/api/quarters/${quarterId}`)
                  if (reloaded.ok) {
                    const reloadedData = await reloaded.json()
                    setTransactions(reloadedData.transactions.map((t: Transaction) => ({
                      ...t,
                      category: t.category || categorizeTransaction(t.description),
                    })))
                  }
                } else {
                  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                  const res = await fetch('/api/quarters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      label: `Q${selectedQuarter!.quarter} ${selectedQuarter!.year}`,
                      year: selectedQuarter!.year,
                      quarter: selectedQuarter!.quarter,
                      cash_sources: cashSources,
                      transactions: filtered,
                      pl_summary: { totalIncome, totalExpenses, netCashflow: totalIncome - totalExpenses, byCategory: [] },
                    }),
                  })
                  const created = await res.json()
                  setLoadedQuarterId(created.id)
                }
              }} />
            ) : (
              <div className="space-y-6">
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
                    <TransactionsTable transactions={transactions} onCategoryChange={handleCategoryChange} />
                    <div className="flex justify-end">
                      <button
                        onClick={() => setTransactions(null)}
                        className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        Re-upload CSV
                      </button>
                    </div>
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
