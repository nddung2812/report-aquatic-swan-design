export interface CashSource {
  id: 'paypal' | 'stripe' | 'commbank_transaction' | 'commbank_saver'
  label: string
  openingBalance: number
  closingBalance: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  balance: number
  category: string
  type: 'income' | 'expense'
}

export interface PLStatement {
  totalIncome: number
  totalExpenses: number
  netCashflow: number
  byCategory: Array<{
    category: string
    amount: number
    type: 'income' | 'expense'
  }>
}

export interface ServiceCustomer {
  id: number
  name: string
  service_description: string
  frequency: 'Monthly' | 'Bi-Monthly' | 'Quarterly' | 'Bi-Annually' | 'Annually'
  last_service: string | null
  next_service: string | null
  notes: string
}

export interface QuarterRecord {
  id: number
  label: string
  year: number
  quarter: number
  created_at: string
  cash_sources: CashSource[]
  transactions: Transaction[]
  pl_summary: PLStatement
}
