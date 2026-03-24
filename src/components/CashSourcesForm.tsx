import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CashSource } from '@/types/finance'

const cashSourcesSchema = z.object({
  paypal: z.coerce.number().min(0, 'Must be a positive number'),
  stripe: z.coerce.number().min(0, 'Must be a positive number'),
  commbank_transaction: z.coerce.number().min(0, 'Must be a positive number'),
  commbank_saver: z.coerce.number().min(0, 'Must be a positive number'),
})

type CashSourcesFormData = z.infer<typeof cashSourcesSchema>

interface CashSourcesFormProps {
  onSubmit: (sources: CashSource[]) => void
}

const sourceDefinitions: Array<{ id: keyof CashSourcesFormData; label: string }> = [
  { id: 'paypal', label: 'PayPal Balance' },
  { id: 'stripe', label: 'Stripe Balance' },
  { id: 'commbank_transaction', label: 'CommBank Transaction Account' },
  { id: 'commbank_saver', label: 'CommBank Saver Account' },
]

export function CashSourcesForm({ onSubmit }: CashSourcesFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CashSourcesFormData>({
    resolver: zodResolver(cashSourcesSchema) as any,
    defaultValues: {
      paypal: 0,
      stripe: 0,
      commbank_transaction: 0,
      commbank_saver: 0,
    },
  })

  const handleFormSubmit = (data: CashSourcesFormData) => {
    const sources: CashSource[] = sourceDefinitions.map((def) => ({
      id: def.id as 'paypal' | 'stripe' | 'commbank_transaction' | 'commbank_saver',
      label: def.label,
      balance: data[def.id],
    }))
    onSubmit(sources)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Sources</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the current balance for each account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {sourceDefinitions.map((source) => (
              <div key={source.id}>
                <label htmlFor={source.id} className="block text-sm font-medium">
                  {source.label}
                </label>
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    id={source.id}
                    type="number"
                    step="0.01"
                    {...register(source.id)}
                    className="ml-2 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder="0.00"
                  />
                </div>
                {errors[source.id] && (
                  <p className="mt-1 text-sm text-destructive">{errors[source.id]?.message}</p>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-md bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue to CSV Upload
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
