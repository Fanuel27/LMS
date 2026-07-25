import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@tanstack/react-query'

import { userService } from '@/services/user.service'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { Eye, EyeOff, Lock } from 'lucide-react'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function AdminChangePasswordDialog() {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toasts, toast } = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  const mutation = useMutation({
    mutationFn: (data) =>
      userService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast({ description: 'Password changed successfully.' })
      setOpen(false)
      reset()
    },
    onError: (err) => {
      toast({
        description: err.response?.data?.message || 'Failed to change password.',
        variant: 'destructive',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Lock className="w-4 h-4 mr-2" /> Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Update your admin account password. Must be at least 6 characters.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="admin-currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="admin-currentPassword"
                type={showPassword ? 'text' : 'password'}
                {...register('currentPassword')}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-newPassword">New Password</Label>
            <Input
              id="admin-newPassword"
              type={showPassword ? 'text' : 'password'}
              {...register('newPassword')}
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-confirmPassword">Confirm New Password</Label>
            <Input
              id="admin-confirmPassword"
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); reset(); }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
        <Toaster toasts={toasts} />
      </DialogContent>
    </Dialog>
  )
}
