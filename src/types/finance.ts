export interface CashSource {
  id: 'paypal' | 'stripe' | 'commbank_transaction' | 'commbank_saver'
  label: string
  balance: number
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
