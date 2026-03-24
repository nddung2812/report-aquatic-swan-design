export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  type: 'income' | 'expense'
  amount: number
}

export interface MonthlySummary {
  month: string
  revenue: number
  expenses: number
}
