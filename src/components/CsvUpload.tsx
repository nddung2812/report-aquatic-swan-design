import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { parseCommBankCSV, parseExcelFile } from '@/lib/csvParser'
import type { Transaction } from '@/types/finance'

interface CsvUploadProps {
  onUpload: (transactions: Transaction[]) => void
}

export function CsvUpload({ onUpload }: CsvUploadProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setFileName(file.name)

    // Always try to read as ArrayBuffer first (works for both CSV and Excel)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        let transactions: Transaction[]
        const arrayBuffer = e.target?.result as ArrayBuffer
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

        if (isExcel) {
          transactions = parseExcelFile(arrayBuffer)
        } else {
          // Use plain CSV parser for .csv files — XLSX misreads DD/MM/YYYY dates
          // where day ≤ 12 as MM/DD/YYYY, putting them in the wrong quarter
          const csvText = new TextDecoder().decode(arrayBuffer)
          transactions = parseCommBankCSV(csvText)
        }

        console.log('Parsed transactions:', transactions.length)
        if (transactions.length === 0) {
          throw new Error('No valid transactions found in file')
        }

        setParsedTransactions(transactions)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to parse file'
        console.error('Parse error:', errMsg, err)
        setError(errMsg)
        setFileName('')
        setParsedTransactions(null)
      } finally {
        setLoading(false)
      }
    }

    reader.onerror = () => {
      setError('Failed to read file')
      setFileName('')
      setLoading(false)
    }

    // Always read as ArrayBuffer - it works for both formats
    reader.readAsArrayBuffer(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Bank Statement</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your CommBank CSV or Excel file to parse transactions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!parsedTransactions ? (
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
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Drop CSV or Excel file here or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  File should have columns: Date, Amount, Description, Balance
                </p>
                {fileName && !error && (
                  <p className="text-sm text-green-600">✓ {fileName}</p>
                )}
                {error && (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">✗ {error}</p>
                    <p className="text-xs text-muted-foreground">
                      Check browser console (F12) for more details. Try uploading again.
                    </p>
                  </div>
                )}
                {loading && (
                  <p className="text-sm text-muted-foreground">Parsing file...</p>
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
          ) : (
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">✓ File uploaded successfully</p>
                <p className="text-sm text-muted-foreground">
                  {fileName} — {parsedTransactions.length} transactions found
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpload(parsedTransactions)}
                  className="flex-1 rounded-md bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setParsedTransactions(null)
                    setFileName('')
                    setError('')
                  }}
                  className="flex-1 rounded-md border border-input py-2 font-medium hover:bg-muted"
                >
                  Upload Different File
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
