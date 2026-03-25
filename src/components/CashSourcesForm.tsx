import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { accountLogos } from '@/lib/accountLogos'
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
  { id: 'commbank_transaction', label: 'CommBank Transaction' },
  { id: 'commbank_saver', label: 'CommBank Saver' },
]

const inputCls = 'w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

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
      <CardHeader className="pb-3">
        <CardTitle>Cash Sources</CardTitle>
        <p className="text-sm text-muted-foreground">Opening and closing balances for each account</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Column headers */}
          <div className="mb-2 grid grid-cols-[1fr_1fr_1fr] gap-3 px-1 text-xs font-medium text-muted-foreground">
            <span>Account</span>
            <span>Opening Balance</span>
            <span>Closing Balance</span>
          </div>

          <div className="space-y-2">
            {sourceDefinitions.map((source) => (
              <div key={source.id} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
                {/* Account */}
                <div className="flex items-center gap-2">
                  {accountLogos[source.id]}
                  <span className="text-sm font-medium">{source.label}</span>
                </div>

                {/* Opening */}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`${source.id}_opening` as const)}
                      className={inputCls}
                    />
                  </div>
                  {errors[`${source.id}_opening` as keyof typeof errors] && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {errors[`${source.id}_opening` as keyof typeof errors]?.message}
                    </p>
                  )}
                </div>

                {/* Closing */}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`${source.id}_closing` as const)}
                      className={inputCls}
                    />
                  </div>
                  {errors[`${source.id}_closing` as keyof typeof errors] && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {errors[`${source.id}_closing` as keyof typeof errors]?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue to CSV Upload
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
