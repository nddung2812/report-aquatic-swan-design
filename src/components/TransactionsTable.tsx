import { useState } from 'react'
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

interface TransactionsTableProps {
  transactions: Transaction[]
  onCategoryChange?: (transactionId: string, category: string) => void
}

export function TransactionsTable({ transactions, onCategoryChange }: TransactionsTableProps) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

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
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {new Date(transaction.date).toLocaleDateString('en-AU')}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      {editingCategoryId === transaction.id ? (
                        <select
                          autoFocus
                          defaultValue={transaction.category}
                          onBlur={() => setEditingCategoryId(null)}
                          onChange={(e) => {
                            const newCat = e.target.value
                            onCategoryChange?.(transaction.id, newCat)
                            setEditingCategoryId(null)
                          }}
                          className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ALL_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingCategoryId(transaction.id)}
                          className="cursor-pointer rounded px-1 py-0.5 text-sm hover:bg-muted"
                          title="Click to edit category"
                        >
                          {transaction.type === 'expense'
                            ? transaction.category.replace(/^Sales - /i, '')
                            : transaction.category}
                        </button>
                      )}
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
