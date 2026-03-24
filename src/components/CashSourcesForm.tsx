import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CashSource } from '@/types/finance'

const cashSourcesSchema = z.object({
  paypal_opening: z.coerce.number().min(0, 'Must be a positive number'),
  paypal_closing: z.coerce.number().min(0, 'Must be a positive number'),
  stripe_opening: z.coerce.number().min(0, 'Must be a positive number'),
  stripe_closing: z.coerce.number().min(0, 'Must be a positive number'),
  commbank_transaction_opening: z.coerce.number().min(0, 'Must be a positive number'),
  commbank_transaction_closing: z.coerce.number().min(0, 'Must be a positive number'),
  commbank_saver_opening: z.coerce.number().min(0, 'Must be a positive number'),
  commbank_saver_closing: z.coerce.number().min(0, 'Must be a positive number'),
})

type CashSourcesFormData = z.infer<typeof cashSourcesSchema>

interface CashSourcesFormProps {
  onSubmit: (sources: CashSource[]) => void
}

const sourceDefinitions: Array<{
  id: 'paypal' | 'stripe' | 'commbank_transaction' | 'commbank_saver'
  label: string
}> = [
  { id: 'paypal', label: 'PayPal' },
  { id: 'stripe', label: 'Stripe' },
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
      paypal_opening: 0,
      paypal_closing: 0,
      stripe_opening: 0,
      stripe_closing: 0,
      commbank_transaction_opening: 0,
      commbank_transaction_closing: 0,
      commbank_saver_opening: 0,
      commbank_saver_closing: 0,
    },
  })

  const handleFormSubmit = (data: CashSourcesFormData) => {
    const sources: CashSource[] = sourceDefinitions.map((def) => ({
      id: def.id,
      label: def.label,
      openingBalance: data[`${def.id}_opening` as keyof CashSourcesFormData] as number,
      closingBalance: data[`${def.id}_closing` as keyof CashSourcesFormData] as number,
    }))
    onSubmit(sources)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Sources</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter opening and closing balances for each account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {sourceDefinitions.map((source) => (
            <div key={source.id} className="rounded-lg border border-input bg-muted/25 p-4">
              <h3 className="font-medium">{source.label}</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor={`${source.id}_opening`} className="block text-sm font-medium">
                    Opening Balance
                  </label>
                  <div className="mt-2 flex items-center">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      id={`${source.id}_opening`}
                      type="number"
                      step="0.01"
                      {...register(`${source.id}_opening` as const)}
                      className="ml-2 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="0.00"
                    />
                  </div>
                  {errors[`${source.id}_opening` as keyof typeof errors] && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors[`${source.id}_opening` as keyof typeof errors]?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`${source.id}_closing`} className="block text-sm font-medium">
                    Closing Balance
                  </label>
                  <div className="mt-2 flex items-center">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      id={`${source.id}_closing`}
                      type="number"
                      step="0.01"
                      {...register(`${source.id}_closing` as const)}
                      className="ml-2 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="0.00"
                    />
                  </div>
                  {errors[`${source.id}_closing` as keyof typeof errors] && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors[`${source.id}_closing` as keyof typeof errors]?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

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
