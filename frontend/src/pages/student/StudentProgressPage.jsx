import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts'
import { 
  Activity, BookOpen, Clock, Target, Trophy, FileText, CheckCircle2,
  TrendingUp, BarChart2, Star, Target as TargetIcon, AlertTriangle
} from 'lucide-react'

import { studentService } from '@/services/student.service'
import PageHeader from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import ErrorBanner from '@/components/admin/ErrorBanner'
import EmptyState from '@/components/admin/EmptyState'

export default function StudentProgressPage() {
  const navigate = useNavigate()

  const { data: overviewRes, isLoading: isLoadingOverview, isError: isErrorOverview } = useQuery({
    queryKey: ['student-progress-overview'],
    queryFn: async () => {
      const res = await studentService.getProgressOverview()
      return res.data.data
    }
  })

  const { data: practiceRes, isLoading: isLoadingPractice } = useQuery({
    queryKey: ['student-progress-practice', 1],
    queryFn: async () => {
      const res = await studentService.getProgressPracticeHistory({ page: 1, limit: 10 })
      return res.data.data
    }
  })

  const { data: mockRes, isLoading: isLoadingMock } = useQuery({
    queryKey: ['student-progress-mocks', 1],
    queryFn: async () => {
      const res = await studentService.getProgressMockHistory({ page: 1, limit: 10 })
      return res.data.data
    }
  })

  const { data: subjectsRes, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['student-progress-subjects'],
    queryFn: async () => {
      const res = await studentService.getProgressSubjects()
      return res.data.data
    }
  })

  const { data: activityRes, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['student-progress-activity'],
    queryFn: async () => {
      const res = await studentService.getProgressActivity()
      return res.data.data
    }
  })

  const isLoading = isLoadingOverview || isLoadingPractice || isLoadingMock || isLoadingSubjects || isLoadingActivity;
  if (isErrorOverview) return <ErrorBanner message="Failed to load analytics dashboard" />
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Progress & Analytics" description="Loading your learning insights..." />
        <CardGridSkeleton count={4} />
      </div>
    )
  }

  const overview = overviewRes || {}
  const subjects = subjectsRes || []
  const practiceHistory = practiceRes?.history || []
  const mockHistory = mockRes?.history || []
  const activity = activityRes || []

  // Derived Data for Charts
  // 1. Bar Chart: Practice Accuracy by Subject
  const barChartData = subjects.map(s => ({
    name: s.subjectName,
    Accuracy: s.practiceAccuracy
  }))

  // 2. Line Chart: Mock Exam Scores Over Time
  const lineChartData = [...mockHistory].reverse().map((m, idx) => ({
    name: `Exam ${idx + 1}`,
    Score: m.score,
    date: new Date(m.submittedAt).toLocaleDateString()
  }))

  // 3. Radar Chart: Practice vs Mock Comparison
  const radarChartData = subjects.map(s => ({
    subject: s.subjectName,
    Practice: s.practiceAccuracy,
    Mock: s.mockAverage
  }))

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <PageHeader 
        title="Progress & Analytics" 
        description="Comprehensive insights into your learning journey and exam readiness."
      />

      {/* SECTION 1: Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Learning Progress</p>
                <h3 className="text-3xl font-bold text-foreground">{overview.overallLearningProgress || 0}%</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            </div>
            <Progress value={overview.overallLearningProgress || 0} className="mt-4 h-2" indicatorClassName="bg-blue-600" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Practice Accuracy</p>
                <h3 className="text-3xl font-bold text-foreground">{overview.overallPracticeAccuracy || 0}%</h3>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full"><TargetIcon className="w-5 h-5 text-emerald-600" /></div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground font-medium">
              <span className="text-emerald-600 font-bold">{overview.totalPracticeQuestions || 0}</span> questions answered
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Mock Average</p>
                <h3 className="text-3xl font-bold text-foreground">{overview.overallMockAverage || 0}%</h3>
              </div>
              <div className="p-3 bg-violet-100 rounded-full"><FileText className="w-5 h-5 text-violet-600" /></div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground font-medium">
              <span className="text-violet-600 font-bold">{overview.totalMockExamsTaken || 0}</span> exams completed
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Current Streak</p>
                <h3 className="text-3xl font-bold text-foreground">{overview.currentPracticeStreak || 0} <span className="text-base text-muted-foreground font-normal">correct</span></h3>
              </div>
              <div className="p-3 bg-amber-100 rounded-full"><Activity className="w-5 h-5 text-amber-600" /></div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-500" /> Best streak: <span className="font-bold text-foreground">{overview.bestPracticeStreak || 0}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 6 & CHARTS: Performance Summary & Data Visualization */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Summary */}
        <Card className="lg:col-span-1 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart2 className="w-5 h-5 text-primary" /> Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-4">
            <div className="bg-muted/30 p-4 rounded-xl border border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Highest Mock Score</p>
                  <p className="text-2xl font-black">{overview.highestMockScore || 0}%</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Lowest Mock Score</p>
                  <p className="text-2xl font-black">{overview.lowestMockScore || 0}%</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Avg Time Per Exam</p>
                  <p className="text-2xl font-black">{Math.floor((overview.averageTimePerMock || 0) / 60)}m {(overview.averageTimePerMock || 0) % 60}s</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-primary/5 p-4 rounded-xl text-center border border-primary/10">
                <p className="text-2xl font-bold text-primary">{overview.practiceQuestionsThisWeek || 0}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Questions This Week</p>
              </div>
              <div className="bg-violet-50 p-4 rounded-xl text-center border border-violet-100">
                <p className="text-2xl font-bold text-violet-600">{overview.mockExamsThisMonth || 0}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Exams This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart: Practice vs Mock */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Practice vs Mock Readiness</CardTitle>
            <CardDescription>Comparison of your practice accuracy against mock exam scores across subjects.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {radarChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Radar name="Practice Accuracy" dataKey="Practice" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Radar name="Mock Average" dataKey="Mock" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Legend />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart2} title="No subject data yet" description="Complete practice sessions or exams to see readiness." />
            )}
          </CardContent>
        </Card>

      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Practice Accuracy by Subject</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Target} title="No practice data yet" description="Start a practice session to view accuracy." />
            )}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mock Exam Scores Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="Score" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={TrendingUp} title="No mock exam data" description="Complete mock exams to track score progression." />
            )}
          </CardContent>
        </Card>
      </section>

      {/* SECTION 2: Performance by Subject Table */}
      <section>
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border bg-muted/20 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Performance by Subject</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {subjects.length === 0 ? (
              <div className="p-8"><EmptyState icon={BookOpen} title="No subject performance data" description="You haven't completed any sessions yet." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium text-center">Practice Accuracy</th>
                      <th className="px-6 py-4 font-medium text-center">Mock Average</th>
                      <th className="px-6 py-4 font-medium text-center">Best Score</th>
                      <th className="px-6 py-4 font-medium text-center">Attempts (P / M)</th>
                      <th className="px-6 py-4 font-medium text-right">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subjects.map(s => (
                      <tr key={s.subjectName} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">{s.subjectName}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className={s.practiceAccuracy >= 70 ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : s.practiceAccuracy > 0 ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-border text-muted-foreground'}>
                            {s.practiceAccuracy}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className={s.mockAverage >= 70 ? 'border-violet-200 text-violet-700 bg-violet-50' : s.mockAverage > 0 ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-border text-muted-foreground'}>
                            {s.mockAverage}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-foreground">{s.bestScore}%</td>
                        <td className="px-6 py-4 text-center font-medium text-muted-foreground">
                          {s.practiceAttempts} / {s.mockExamsTaken}
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {s.lastActivity ? new Date(s.lastActivity).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* SECTION 4: Mock Exam History */}
      <section>
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border bg-muted/20 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Mock Exam History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {mockHistory.length === 0 ? (
              <div className="p-8"><EmptyState icon={FileText} title="No mock exams yet" description="Complete a mock exam to see history here." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Exam</th>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium text-center">Score</th>
                      <th className="px-6 py-4 font-medium text-center">Result</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockHistory.map(m => (
                      <tr key={m.attemptId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-muted-foreground">{new Date(m.submittedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{m.examTitle}</td>
                        <td className="px-6 py-4"><Badge variant="outline">{m.subject}</Badge></td>
                        <td className="px-6 py-4 text-center font-bold text-foreground">{m.score}%</td>
                        <td className="px-6 py-4 text-center">
                          {m.passed ? <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">PASS</Badge> : <Badge variant="destructive" className="border-none">FAIL</Badge>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/student/exams?review=${m.attemptId}`)}>
                            Review Attempt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 3: Practice History */}
        <section>
          <Card className="shadow-sm h-full">
            <CardHeader className="border-b border-border bg-muted/20 pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><TargetIcon className="w-5 h-5 text-emerald-500" /> Recent Practice Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {practiceHistory.length === 0 ? (
                <div className="p-8"><EmptyState icon={TargetIcon} title="No practice history" description="Start practicing to populate this table." /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Subject</th>
                        <th className="px-4 py-3 font-medium text-center">Acc.</th>
                        <th className="px-4 py-3 font-medium text-center">C/I</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {practiceHistory.slice(0, 5).map(p => (
                        <tr key={p.sessionId} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.completedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{p.subject}</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-600">{p.accuracy}%</td>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                            <span className="text-emerald-600">{p.correct}</span> / <span className="text-destructive">{p.incorrect}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 border-t border-border text-center bg-muted/10">
                    <Link to="/student/practice" className="text-xs font-bold text-primary hover:underline">
                      View all practice sessions &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* SECTION 5: Recent Activity Timeline */}
        <section>
          <Card className="shadow-sm h-full">
            <CardHeader className="border-b border-border bg-muted/20 pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {activity.length === 0 ? (
                <EmptyState icon={Activity} title="No activity" description="Your timeline is empty." />
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {activity.slice(0, 6).map((item, idx) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 
                        bg-violet-100 text-violet-600">
                        {item.type === 'MOCK_EXAM' ? <FileText className="w-4 h-4" /> : <TargetIcon className="w-4 h-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-[10px] h-5">{item.subject}</Badge>
                          <time className="text-[10px] text-muted-foreground font-medium">{new Date(item.date).toLocaleDateString()}</time>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Scored <span className={`font-bold ${item.type === 'MOCK_EXAM' ? 'text-violet-600' : 'text-emerald-600'}`}>{item.score}%</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

    </div>
  )
}
