import type { Transaction } from '@/types/finance'

const categoryKeywords: Record<string, string[]> = {
  Sales: ['paypal', 'stripe', 'invoice', 'payment received', 'transfer in'],
  Payroll: ['payroll', 'salary', 'wages', 'superannuation'],
  Marketing: ['facebook', 'google', 'ads', 'marketing', 'advertising'],
  Operations: ['rent', 'utilities', 'electricity', 'internet', 'office', 'supplies'],
  Tax: ['ato', 'tax', 'gst', 'bpay'],
}

function categorizeTransaction(description: string): string {
  const lowerDesc = description.toLowerCase()

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword: string) => lowerDesc.includes(keyword))) {
      return category
    }
  }

  return 'Other'
}

export function parseCommBankCSV(csvText: string): Transaction[] {
  const lines = csvText.trim().split('\n')

  if (lines.length < 2) {
    throw new Error('CSV is empty or invalid')
  }

  // Skip header row
  const transactions: Transaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line (handle quoted fields)
    const fields = parseCSVLine(line)

    if (fields.length < 4) {
      console.warn(`Skipping invalid row ${i}: insufficient columns`)
      continue
    }

    const [dateStr, amountStr, description, balanceStr] = fields

    try {
      const date = parseDate(dateStr)
      const amount = parseFloat(amountStr)
      const balance = parseFloat(balanceStr)

      if (isNaN(amount) || isNaN(balance)) {
        console.warn(`Skipping row ${i}: invalid numeric values`)
        continue
      }

      const type = amount >= 0 ? 'income' : 'expense'
      const category = categorizeTransaction(description)

      transactions.push({
        id: `txn-${i}-${Date.now()}`,
        date,
        description: description.trim(),
        amount: Math.abs(amount),
        balance,
        category,
        type,
      })
    } catch (error) {
      console.warn(`Skipping row ${i}: ${error}`)
    }
  }

  return transactions
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === ',' && !insideQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }

  fields.push(current)
  return fields.map((f) => f.replace(/^"|"$/g, '').trim())
}

function parseDate(dateStr: string): string {
  const trimmed = dateStr.trim().replace(/^"|"$/g, '')

  // Try DD/MM/YYYY format
  const match1 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match1) {
    const [, day, month, year] = match1
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Try DD Mon YYYY format
  const match2 = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/)
  if (match2) {
    const [, day, monthStr, year] = match2
    const months: Record<string, string> = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    }
    const month = months[monthStr] || '01'
    return `${year}-${month}-${day.padStart(2, '0')}`
  }

  throw new Error(`Could not parse date: ${dateStr}`)
}
