import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { studentService } from '@/services/student.service'

import PageHeader from '@/components/admin/PageHeader'
import ErrorBanner from '@/components/admin/ErrorBanner'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Target, FileText, Activity, Clock } from 'lucide-react'

import ProfileForm from '@/components/student/ProfileForm'
import ChangePasswordDialog from '@/components/student/ChangePasswordDialog'
import LeaderboardTable from '@/components/student/LeaderboardTable'

export default function StudentProfilePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const res = await studentService.getProfile()
      return res.data.data
    }
  })

  if (isError) return <ErrorBanner message="Failed to load profile data." />
  
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <PageHeader title="Profile & Leaderboard" description="Loading profile..." />
        <CardGridSkeleton count={3} />
      </div>
    )
  }

  const profile = data || {}
  const stats = profile.stats || {}
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'ST'

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <PageHeader 
        title="Profile & Leaderboard" 
        description="Manage your account and compare your performance with peers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card & Summary */}
        <div className="space-y-6">
          <Card className="shadow-sm overflow-hidden relative">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 absolute w-full top-0 left-0" />
            <CardContent className="pt-12 px-6 pb-6 relative z-10 text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background shadow-md">
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-foreground">{profile.fullName}</h2>
              <p className="text-muted-foreground mb-4">{profile.email}</p>
              
              <div className="flex justify-center gap-2 mb-6">
                <Badge variant="outline" className="bg-primary/5">{profile.role}</Badge>
                <Badge variant="outline" className="bg-muted"><Clock className="w-3 h-3 mr-1" /> Member since {new Date(profile.createdAt).getFullYear()}</Badge>
              </div>

              <ChangePasswordDialog />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Academic Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                  <Target className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700">{stats.overallPracticeAccuracy || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Practice Acc.</p>
                </div>
                <div className="bg-violet-50 border border-violet-100 p-4 rounded-xl text-center">
                  <FileText className="w-6 h-6 text-violet-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-violet-700">{stats.averageMockScore || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Mock Avg.</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center col-span-2 flex justify-around items-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Best Score</p>
                    <p className="text-xl font-bold text-amber-700">{stats.bestMockScore || 0}%</p>
                  </div>
                  <div className="h-8 w-px bg-amber-200" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Total Practiced</p>
                    <p className="text-xl font-bold text-amber-700">{stats.totalPracticeQuestions || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Form & Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileForm defaultValues={{ fullName: profile.fullName, email: profile.email }} />
          <LeaderboardTable />
        </div>
      </div>
    </div>
  )
}
