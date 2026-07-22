import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsService } from '@/services/adminAnalytics.service';
import PageHeader from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/admin/ErrorBanner';
import { Users, BookOpen, GraduationCap, FileText, CheckCircle2, TrendingUp, Activity, PenTool } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalyticsPage() {
  const { data: overviewRes, isLoading: loadingOverview, isError: errOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => adminAnalyticsService.getOverview().then(res => res.data.data),
    staleTime: 60000,
  });

  const { data: usersRes, isLoading: loadingUsers, isError: errUsers } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: () => adminAnalyticsService.getUsersAnalytics().then(res => res.data.data),
    staleTime: 60000,
  });

  const { data: subjectsRes, isLoading: loadingSubjects, isError: errSubjects } = useQuery({
    queryKey: ['analytics-subjects'],
    queryFn: () => adminAnalyticsService.getSubjectsAnalytics().then(res => res.data.data),
    staleTime: 60000,
  });

  const { data: feedRes, isLoading: loadingFeed, isError: errFeed } = useQuery({
    queryKey: ['analytics-activity'],
    queryFn: () => adminAnalyticsService.getActivityFeed().then(res => res.data.data),
    staleTime: 60000,
  });

  const { data: perfRes, isLoading: loadingPerf, isError: errPerf } = useQuery({
    queryKey: ['analytics-performance'],
    queryFn: () => adminAnalyticsService.getPerformanceAnalytics().then(res => res.data.data),
    staleTime: 60000,
  });

  if (loadingOverview || loadingUsers || loadingSubjects || loadingFeed || loadingPerf) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (errOverview || errUsers || errSubjects || errFeed || errPerf) {
    return <ErrorBanner message="Failed to load analytics data. Please try again." />;
  }

  const overview = overviewRes;
  const users = usersRes;
  const subjects = subjectsRes;
  const activity = feedRes;
  const performance = perfRes;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Analytics & Dashboard"
        description="Real-time insights into platform usage, engagement, and performance."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }]}
      />

      {/* ─── Overview Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Students" value={overview.totalStudents} icon={GraduationCap} color="text-blue-500" />
        <MetricCard title="Teachers" value={overview.totalTeachers} icon={Users} color="text-emerald-500" />
        <MetricCard title="Subjects" value={overview.totalSubjects} icon={BookOpen} color="text-amber-500" />
        <MetricCard title="Questions" value={overview.totalQuestions} icon={CheckCircle2} color="text-purple-500" />
        <MetricCard title="Notes" value={overview.totalNotes} icon={FileText} color="text-pink-500" />
        <MetricCard title="Mock Exams" value={overview.totalMockExams} icon={PenTool} color="text-indigo-500" />
        <MetricCard title="Practice Attempts" value={overview.practiceAttempts} icon={Activity} color="text-cyan-500" />
        <MetricCard title="Mock Attempts" value={overview.mockExamAttempts} icon={TrendingUp} color="text-rose-500" />
      </div>

      {/* ─── Charts Row 1 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">User Growth over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={users.usersByMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Subject Usage (Attempts)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="practiceAttempts" stackId="a" fill="#10b981" name="Practice" />
                <Bar dataKey="mockAttempts" stackId="a" fill="#8b5cf6" name="Mock" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Row 2 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">User Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={users.distribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {users.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Subject Performance Profile</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjects}>
                <PolarGrid opacity={0.2} />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Mock Avg" dataKey="averageMockScore" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Radar name="Practice Avg" dataKey="averagePracticeAccuracy" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tables Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top Performing Students</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mock Avg</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Practice Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.topStudents.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-4 text-sm text-muted-foreground">No students found.</td></tr>
                  )}
                  {performance.topStudents.map((s, idx) => (
                    <tr key={s.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-sm">#{idx + 1}</td>
                      <td className="px-4 py-3 text-sm">{s.name}</td>
                      <td className="px-4 py-3 text-sm">{s.mockAverage}%</td>
                      <td className="px-4 py-3 text-sm">{s.practiceAccuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Most Active Teachers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exams</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.teacherActivity.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-4 text-sm text-muted-foreground">No teachers found.</td></tr>
                  )}
                  {performance.teacherActivity.map((t) => (
                    <tr key={t.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-sm">{t.questionsCreated}</td>
                      <td className="px-4 py-3 text-sm">{t.notesUploaded}</td>
                      <td className="px-4 py-3 text-sm">{t.mockExamsCreated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Subject Analytics Table ───────────────────────────────────────────── */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Subject Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Practice Attempts</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mock Attempts</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Practice</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Mock</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 && (
                  <tr><td colSpan="7" className="text-center p-4 text-sm text-muted-foreground">No subjects found.</td></tr>
                )}
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-sm">{s.name}</td>
                    <td className="px-4 py-3 text-sm">{s.questionCount}</td>
                    <td className="px-4 py-3 text-sm">{s.notesCount}</td>
                    <td className="px-4 py-3 text-sm">{s.practiceAttempts}</td>
                    <td className="px-4 py-3 text-sm">{s.mockAttempts}</td>
                    <td className="px-4 py-3 text-sm">{s.averagePracticeAccuracy}%</td>
                    <td className="px-4 py-3 text-sm">{s.averageMockScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Activity Feed ───────────────────────────────────────────────────────── */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent Platform Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            {activity.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No recent activity.</div>
            ) : (
              <div className="divide-y">
                {activity.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="h-fit whitespace-nowrap text-[10px]">
                      {item.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value.toLocaleString()}</p>
        </div>
        <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}
