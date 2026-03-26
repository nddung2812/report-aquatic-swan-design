import type { Transaction, PLStatement, CashSource } from '@/types/finance'

export function calculatePLStatement(transactions: Transaction[]): PLStatement {
  const byCategory: Map<string, { amount: number; type: 'income' | 'expense' }> = new Map()

  let totalIncome = 0
  let totalExpenses = 0

  for (const txn of transactions) {
    if (txn.type === 'income') {
      totalIncome += txn.amount
    } else {
      totalExpenses += txn.amount
    }

    const key = `${txn.category}-${txn.type}`
    if (!byCategory.has(key)) {
      byCategory.set(key, { amount: 0, type: txn.type })
    }
    const entry = byCategory.get(key)!
    entry.amount += txn.amount
  }

  const categorized = Array.from(byCategory.entries()).map(([_, data]) => ({
    category: getDisplayCategory(_, data.type),
    ...data,
  }))

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    byCategory: categorized,
  }
}

function getDisplayCategory(key: string, type: 'income' | 'expense'): string {
  // Remove the type suffix from the key
  return key.replace(`-${type}`, '')
}

export function calculateTotalOpening(cashSources: CashSource[]): number {
  return cashSources.reduce((sum, source) => sum + source.openingBalance, 0)
}

export function calculateTotalClosing(cashSources: CashSource[]): number {
  return cashSources.reduce((sum, source) => sum + source.closingBalance, 0)
}

export function calculateNetCashChange(cashSources: CashSource[]): number {
  return calculateTotalClosing(cashSources) - calculateTotalOpening(cashSources)
}

export function calculateTotalCashPosition(cashSources: CashSource[]): number {
  // For backwards compatibility, returns closing balance
  return calculateTotalClosing(cashSources)
}

export function getTransactionsByQuarter(
  transactions: Transaction[],
  quarter: number,
  year: number
): Transaction[] {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = quarter * 3

  return transactions.filter((txn) => {
    const [txnYear, month] = txn.date.split('-').slice(0, 2)
    const txnMonth = parseInt(month)
    return parseInt(txnYear) === year && txnMonth >= startMonth && txnMonth <= endMonth
  })
}
