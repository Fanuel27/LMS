import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { studentService } from '@/services/student.service'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { User } from 'lucide-react'

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters")
})

export default function ProfileForm({ defaultValues }) {
  const { toasts, toast } = useToast()
  const queryClient = useQueryClient()
  const { updateUser } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: defaultValues.fullName || '' }
  })

  const mutation = useMutation({
    mutationFn: (data) => studentService.updateProfile(data),
    onSuccess: (res) => {
      updateUser({ fullName: res.data.data.fullName })
      toast({ description: "Profile updated successfully.", variant: "default" })
      queryClient.invalidateQueries(['student-profile'])
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || "Failed to update profile", variant: "destructive" })
    }
  })

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Edit Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...register('fullName')} placeholder="Enter your full name" />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2 opacity-60">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={defaultValues.email} disabled />
            <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/10 border-t border-border mt-4 py-4 rounded-b-xl flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
      <Toaster toasts={toasts} />
    </Card>
  )
}
