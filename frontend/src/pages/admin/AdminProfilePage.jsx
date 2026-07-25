import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Clock, Shield, Mail, User } from 'lucide-react'

import PageHeader from '@/components/admin/PageHeader'
import AdminProfileForm from '@/components/admin/AdminProfileForm'
import AdminChangePasswordDialog from '@/components/admin/AdminChangePasswordDialog'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

export default function AdminProfilePage() {
  const { user } = useAuth()

  const getInitials = (name) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'AD'

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A'

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <PageHeader
        title="My Profile"
        description="Manage your administrator account settings and security."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left Column: Identity Card ──────────────────────────────── */}
        <div className="space-y-6">
          <Card className="shadow-sm overflow-hidden relative">
            {/* Hero gradient banner */}
            <div className="h-24 bg-gradient-to-r from-primary to-primary/60 absolute w-full top-0 left-0" />

            <CardContent className="pt-12 px-6 pb-6 relative z-10 text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background shadow-md">
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold text-foreground">{user?.fullName}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>

              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Shield className="w-3 h-3 mr-1" />
                  Administrator
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'}
                </Badge>
              </div>

              <AdminChangePasswordDialog />
            </CardContent>
          </Card>

          {/* Account Details card */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Account Details
              </h3>
              <div>
                <InfoRow icon={User} label="Full Name" value={user?.fullName || '—'} />
                <InfoRow icon={Mail} label="Email Address" value={user?.email || '—'} />
                <InfoRow icon={Shield} label="Role" value="Administrator" />
                <InfoRow icon={Clock} label="Member Since" value={memberSince} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Column: Edit Form ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <AdminProfileForm
            defaultValues={{ fullName: user?.fullName, email: user?.email }}
          />

          {/* Security notice card */}
          <Card className="shadow-sm border-amber-200 bg-amber-50/50">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Security Recommendations
              </h3>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>Use a strong, unique password of at least 12 characters.</li>
                <li>Do not share your admin credentials with anyone.</li>
                <li>Contact your system administrator if you suspect unauthorized access.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
