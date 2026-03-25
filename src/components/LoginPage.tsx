import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState<string>('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const handleLogin = async (data: LoginFormData) => {
    setError('')

    // Simulate async validation
    await new Promise((resolve) => setTimeout(resolve, 300))

    const expectedUsername = import.meta.env.VITE_AUTH_USERNAME
    const expectedPassword = import.meta.env.VITE_AUTH_PASSWORD

    if (data.username === expectedUsername && data.password === expectedPassword) {
      onLogin()
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Finance Report</CardTitle>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to access your finance report
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                {...register('username')}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

        </CardContent>
      </Card>
    </div>
  )
}
