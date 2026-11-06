import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const authLogin = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'test@test.com', password: 'password' },
  })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      const res = await login(values)
      authLogin(res.token, { name: res.name, email: res.email })
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand">🏢 Mikis BoQ System</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{serverError}</div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          Any email + any password works (dev mode)
        </p>
      </div>
    </div>
  )
}