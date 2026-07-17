import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { GraduationCap, Eye, EyeOff, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Toaster } from '@/components/ui/Toaster'

export default function StudentLoginPage() {
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
      await login(email, password, 'STUDENT')
      const from = location.state?.from?.pathname || '/student/dashboard'
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
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
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
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-violet-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Student Sign In</CardTitle>
                <CardDescription>Access your exam preparation dashboard</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form id="student-login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="student-email">Email address</Label>
                <Input
                  id="student-email"
                  type="email"
                  autoComplete="email"
                  placeholder="student@example.com"
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
                <Label htmlFor="student-password">Password</Label>
                <div className="relative">
                  <Input
                    id="student-password"
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
                id="student-login-submit"
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in…' : 'Sign In as Student'}
              </Button>
            </form>

            {/* Demo hint */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Demo: <code className="bg-muted px-1 py-0.5 rounded">student@example.com</code> / <code className="bg-muted px-1 py-0.5 rounded">Student123!</code>
            </p>
          </CardContent>
        </Card>

        {/* Role links */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>
            Admin?{' '}
            <a href="/admin/login" className="text-violet-600 hover:underline font-medium">
              Sign in here
            </a>
          </p>
          <p>
            Teacher?{' '}
            <a href="/teacher/login" className="text-violet-600 hover:underline font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>

      <Toaster toasts={toasts} />
    </div>
  )
}
