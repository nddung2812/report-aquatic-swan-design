import { useState, useEffect, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ALL_CATEGORIES } from '@/lib/csvParser'
import type { Transaction } from '@/types/finance'

const HIGHLIGHTS_KEY = 'txn_highlights'

function loadHighlights(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '{}')
  } catch {
    return {}
  }
}

interface TransactionsTableProps {
  transactions: Transaction[]
  onCategoryChange?: (transactionId: string, category: string) => void
}

export function TransactionsTable({ transactions, onCategoryChange }: TransactionsTableProps) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [highlights, setHighlights] = useState<Record<string, string>>(loadHighlights)
  const [openId, setOpenId] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights))
  }, [highlights])

  useEffect(() => {
    if (!openId) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openId])

  const setHighlight = (id: string, color: string) => {
    setHighlights(prev => {
      const next = { ...prev }
      if (color) next[id] = color
      else delete next[id]
      return next
    })
    setOpenId(null)
  }

  const handleTypeChange = (value: string | null) => setType(value ?? '')
  const handleCategoryChange = (value: string | null) => setCategory(value ?? '')

  const categories = Array.from(new Set(transactions.map((t) => t.category))).sort()

  const filteredTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((t) => {
      const matchesSearch =
        !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      const matchesType = !type || t.type === type
      const matchesCategory = !category || t.category === category
      return matchesSearch && matchesType && matchesCategory
    })

  const rowBg: Record<string, string> = {
    red: 'bg-red-50 dark:bg-red-950/40',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/40',
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="h-8 border-0 p-0 text-sm font-medium text-foreground shadow-none focus:ring-0">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead>
                  <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="h-8 border-0 p-0 text-sm font-medium text-foreground shadow-none focus:ring-0">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const hl = highlights[transaction.id]
                  return (
                    <TableRow key={transaction.id} className={rowBg[hl] ?? ''}>
                      <TableCell className="pr-0">
                        <div className="relative" ref={openId === transaction.id ? popoverRef : null}>
                          <button
                            onClick={() => setOpenId(openId === transaction.id ? null : transaction.id)}
                            className={`h-4 w-4 rounded-full border transition-transform hover:scale-110 ${
                              hl === 'red' ? 'bg-red-400 border-red-500' :
                              hl === 'yellow' ? 'bg-yellow-300 border-yellow-400' :
                              'border-dashed border-muted-foreground/40 bg-transparent'
                            }`}
                            title="Highlight row"
                          />
                          {openId === transaction.id && (
                            <div className="absolute left-0 top-5 z-20 flex gap-1.5 rounded-md border bg-background p-2 shadow-md">
                              <button
                                onClick={() => setHighlight(transaction.id, 'red')}
                                className="h-5 w-5 rounded-full bg-red-400 hover:scale-110 transition-transform"
                                title="Red"
                              />
                              <button
                                onClick={() => setHighlight(transaction.id, 'yellow')}
                                className="h-5 w-5 rounded-full bg-yellow-300 hover:scale-110 transition-transform"
                                title="Yellow"
                              />
                              <button
                                onClick={() => setHighlight(transaction.id, '')}
                                className="h-5 w-5 rounded-full border border-input bg-muted text-xs leading-none hover:scale-110 transition-transform flex items-center justify-center"
                                title="Clear"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(transaction.date).toLocaleDateString('en-AU')}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <select
                          value={transaction.category}
                          onChange={(e) => onCategoryChange?.(transaction.id, e.target.value)}
                          className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ALL_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {transaction.type === 'expense' ? cat.replace(/^Sales - /i, '') : cat}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'income' ? '+' : '-'}$
                          {transaction.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        ${transaction.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
