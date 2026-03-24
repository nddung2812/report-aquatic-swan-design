import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { parseCommBankCSV } from '@/lib/csvParser'
import type { Transaction } from '@/types/finance'

interface CsvUploadProps {
  onUpload: (transactions: Transaction[]) => void
}

export function CsvUpload({ onUpload }: CsvUploadProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string
        const transactions = parseCommBankCSV(csvText)

        if (transactions.length === 0) {
          throw new Error('No valid transactions found in CSV')
        }

        onUpload(transactions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV')
        setFileName('')
      } finally {
        setLoading(false)
      }
    }

    reader.onerror = () => {
      setError('Failed to read file')
      setFileName('')
      setLoading(false)
    }

    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Bank Statement</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your CommBank CSV export to parse transactions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className="rounded-lg border-2 border-dashed border-input bg-muted/25 p-8 text-center transition hover:border-primary/50"
            onDragOver={(e) => {
              e.preventDefault()
              e.currentTarget.classList.add('border-primary')
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-primary')
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('border-primary')
              const file = e.dataTransfer.files[0]
              if (file) {
                fileInputRef.current!.files = e.dataTransfer.files
                const event = new Event('change', { bubbles: true })
                fileInputRef.current?.dispatchEvent(event)
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
              <p className="text-xs text-muted-foreground">
                CSV should have columns: Date, Amount, Description, Balance
              </p>
              {fileName && !error && (
                <p className="text-sm text-green-600">✓ {fileName}</p>
              )}
              {error && (
                <p className="text-sm text-destructive">✗ {error}</p>
              )}
              {loading && (
                <p className="text-sm text-muted-foreground">Parsing CSV...</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Browse Files
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
