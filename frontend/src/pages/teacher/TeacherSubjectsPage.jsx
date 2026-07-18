import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BookOpen, BookMarked, Search, Filter, AlertCircle } from 'lucide-react'
import { teacherService } from '@/services/user.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import { cn } from '@/lib/utils'

export default function TeacherSubjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')

  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const res = await teacherService.getSubjects()
      return res.data
    },
  })

  const subjects = response?.data || []

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'ALL' || subject.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse all available subjects in the curriculum.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="flex bg-muted p-1 rounded-lg">
            {['ALL', 'NATURAL', 'SOCIAL'].map((cat) => (
              <button
                key={cat}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  filterCategory === cat
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setFilterCategory(cat)}
              >
                {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <CardGridSkeleton count={8} />
      ) : isError ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-destructive">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="font-semibold">Failed to load subjects</p>
            <p className="text-sm opacity-90 mt-1">{error?.message || 'An unexpected error occurred.'}</p>
          </CardContent>
        </Card>
      ) : filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">No subjects found</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              We couldn't find any subjects matching your current filters. Try adjusting your search term or category.
            </p>
            {(searchTerm || filterCategory !== 'ALL') && (
              <button
                className="mt-6 text-sm text-emerald-600 font-medium hover:underline"
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('ALL')
                }}
              >
                Clear all filters
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-lg font-bold group-hover:text-emerald-600 transition-colors">
                  {subject.name}
                </CardTitle>
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    subject.category === 'NATURAL' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                  )}
                >
                  <BookMarked className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="outline"
                  className={cn(
                    'mb-4 text-[10px] tracking-wider uppercase font-bold',
                    subject.category === 'NATURAL'
                      ? 'border-blue-200 text-blue-700 bg-blue-50'
                      : 'border-orange-200 text-orange-700 bg-orange-50'
                  )}
                >
                  {subject.category} SCIENCES
                </Badge>
                
                <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Questions</p>
                    <p className="text-sm font-bold text-foreground">{subject._count?.questions || 0}</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Notes</p>
                    <p className="text-sm font-bold text-foreground">{subject._count?.notes || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Exams</p>
                    <p className="text-sm font-bold text-foreground">{subject._count?.mockExams || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
