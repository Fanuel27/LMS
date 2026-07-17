import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Shield, Eye, EyeOff, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Toaster } from '@/components/ui/Toaster'

export default function AdminLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toasts, toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async ({ email, password }) => {
    setIsLoading(true)
    try {
      await login(email, password, 'ADMIN')
      const from = location.state?.from?.pathname || '/admin/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Login failed. Please check your credentials.'
      toast({ title: 'Login Failed', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Exam Prep Ethiopia
          </h1>
          <p className="text-sm text-muted-foreground">National Grade 12 Exam Preparation Platform</p>
        </div>

        {/* Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Admin Sign In</CardTitle>
                <CardDescription>Access the administration portal</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form id="admin-login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  disabled={isLoading}
                  {...register('email', {
                    required: 'Email is required.',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address.',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pr-10"
                    {...register('password', { required: 'Password is required.' })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                id="admin-login-submit"
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in…' : 'Sign In as Admin'}
              </Button>
            </form>

            {/* Demo hint */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Demo: <code className="bg-muted px-1 py-0.5 rounded">admin@example.com</code> / <code className="bg-muted px-1 py-0.5 rounded">Admin123!</code>
            </p>
          </CardContent>
        </Card>

        {/* Role links */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>
            Teacher?{' '}
            <a href="/teacher/login" className="text-primary hover:underline font-medium">
              Sign in here
            </a>
          </p>
          <p>
            Student?{' '}
            <a href="/student/login" className="text-primary hover:underline font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>

      <Toaster toasts={toasts} />
    </div>
  )
}
