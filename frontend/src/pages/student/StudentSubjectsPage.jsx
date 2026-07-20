import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BookMarked, FileText, ClipboardList } from 'lucide-react'

import { studentService } from '@/services/student.service'
import PageHeader from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import ErrorBanner from '@/components/admin/ErrorBanner'
import EmptyState from '@/components/admin/EmptyState'

export default function StudentSubjectsPage() {
  const navigate = useNavigate()

  const { data: subjects, isLoading, isError, error } = useQuery({
    queryKey: ['student-subjects'],
    queryFn: async () => {
      const res = await studentService.getSubjects()
      return res.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader title="Subjects" description="Browse all available subjects." />
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader title="Subjects" description="Browse all available subjects." />
        <ErrorBanner message={error?.response?.data?.message || 'Failed to load subjects'} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader 
        title="Subjects" 
        description="Browse all available subjects and discover study materials and mock exams." 
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No subjects available"
          description="There are currently no subjects available. Please check back later."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card 
              key={subject.id} 
              className="hover:shadow-md hover:border-violet-300 transition-all cursor-pointer group"
              onClick={() => navigate(`/student/notes?subjectId=${subject.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookMarked className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className={
                    subject.category === 'NATURAL' 
                      ? 'border-blue-200 text-blue-700 bg-blue-50' 
                      : 'border-orange-200 text-orange-700 bg-orange-50'
                  }>
                    {subject.category}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-violet-600 transition-colors">
                  {subject.name}
                </h3>
                
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground">
                      <FileText className="w-4 h-4 mr-2" /> Study Notes
                    </span>
                    <span className="font-semibold text-foreground">{subject._count.notes}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground">
                      <ClipboardList className="w-4 h-4 mr-2" /> Mock Exams
                    </span>
                    <span className="font-semibold text-foreground">{subject._count.mockExams}</span>
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
