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
  netProfit: number
  byCategory: Array<{
    category: string
    amount: number
    type: 'income' | 'expense'
  }>
}

export type ServiceLineStatus = 'done' | 'not_yet' | 'soon' | 'free_service'

export interface ServiceScheduleLine {
  id: number
  sort_order: number
  visit_date: string
  month_label: string
  status: ServiceLineStatus
}

export type ServiceFrequency =
  | 'Monthly'
  | 'Bi-Monthly'
  | 'Quarterly'
  | 'Bi-Annually'
  | 'Annually'

export interface ServiceLocation {
  id: number
  customer_id: number
  label: string
  service_description: string
  frequency: ServiceFrequency
  last_service: string | null
  next_service: string | null
  notes: string
  schedule?: ServiceScheduleLine[]
}

export interface ServiceCustomer {
  id: number
  name: string
  notes: string
  locations: ServiceLocation[]
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
