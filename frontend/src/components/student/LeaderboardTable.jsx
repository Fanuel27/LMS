import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studentService } from '@/services/student.service'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Search, Trophy, Medal, ChevronLeft, ChevronRight } from 'lucide-react'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import ErrorBanner from '@/components/admin/ErrorBanner'

export default function LeaderboardTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(handler)
  }, [search])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-leaderboard', page, debouncedSearch],
    queryFn: async () => {
      const res = await studentService.getLeaderboard({ page, limit: 10, search: debouncedSearch })
      return res.data.data
    },
    keepPreviousData: true
  })

  if (isError) return <ErrorBanner message="Failed to load leaderboard." />

  const leaderboard = data?.leaderboard || []
  const pagination = data?.pagination || { page: 1, totalPages: 1 }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Leaderboard</CardTitle>
            <CardDescription>Compare your performance with other students globally.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </CardHeader>
      
      {isLoading ? (
        <CardContent className="p-6">
          <CardGridSkeleton count={1} />
        </CardContent>
      ) : leaderboard.length === 0 ? (
        <CardContent className="p-10">
          <EmptyState icon={Medal} title="No students found" description="Try a different search query." />
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium text-center">Rank</th>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium text-center">Avg Mock</th>
                  <th className="px-6 py-4 font-medium text-center">Practice Acc</th>
                  <th className="px-6 py-4 font-medium text-center">Best Streak</th>
                  <th className="px-6 py-4 font-medium text-center hidden sm:table-cell">Exams (P/M)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.map(student => (
                  <tr key={student.rank} className={`hover:bg-muted/30 transition-colors ${student.isMe ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      {student.rank === 1 ? <Medal className="w-6 h-6 text-yellow-500 mx-auto" />
                        : student.rank === 2 ? <Medal className="w-6 h-6 text-gray-400 mx-auto" />
                        : student.rank === 3 ? <Medal className="w-6 h-6 text-amber-600 mx-auto" />
                        : <span className="font-bold text-muted-foreground">#{student.rank}</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground flex items-center gap-2">
                        {student.fullName}
                        {student.isMe && <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">You</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-violet-600">{student.averageMockScore}%</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{student.practiceAccuracy}%</td>
                    <td className="px-6 py-4 text-center text-amber-600 font-bold">{student.bestStreak}</td>
                    <td className="px-6 py-4 text-center font-medium text-muted-foreground hidden sm:table-cell">
                      {student.totalPracticeQuestions} / {student.mockExamsTaken}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
