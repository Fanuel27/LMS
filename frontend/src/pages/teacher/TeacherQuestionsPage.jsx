import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  HelpCircle, ChevronLeft, ChevronRight 
} from 'lucide-react'

import { questionService } from '@/services/question.service'
import { teacherService } from '@/services/user.service'
import { useToast } from '@/hooks/useToast'

import PageHeader from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import ErrorBanner from '@/components/admin/ErrorBanner'
import EmptyState from '@/components/admin/EmptyState'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import QuestionModal from '@/components/teacher/QuestionModal'

export default function TeacherQuestionsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('ALL')
  const [sort, setSort] = useState('desc')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null })

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(handler)
  }, [search])

  // Queries
  const { data: subjectsRes } = useQuery({
    queryKey: ['teacher-subjects-list'],
    queryFn: async () => {
      const res = await teacherService.getSubjects()
      return res.data.data
    },
  })

  const { data: questionsRes, isLoading, isError, error } = useQuery({
    queryKey: ['teacher-questions', page, debouncedSearch, subjectFilter, sort],
    queryFn: async () => {
      const res = await questionService.getQuestions({
        page,
        limit: 10,
        search: debouncedSearch,
        subjectId: subjectFilter === 'ALL' ? undefined : subjectFilter,
        sort
      })
      return res.data.data
    },
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: questionService.deleteQuestion,
    onSuccess: () => {
      toast({ description: 'Question deleted successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      setDeleteDialog({ isOpen: false, id: null })
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to delete question', variant: 'destructive' })
      setDeleteDialog({ isOpen: false, id: null })
    }
  })

  const openCreateModal = () => {
    setEditingQuestion(null)
    setIsModalOpen(true)
  }

  const openEditModal = (q) => {
    setEditingQuestion(q)
    setIsModalOpen(true)
  }

  const questions = questionsRes?.questions || []
  const pagination = questionsRes?.pagination || { totalPages: 1 }
  const subjects = subjectsRes || []

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Question Bank"
        description="Manage your multiple-choice questions for all subjects."
        actions={
          <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Question
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1) }}
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </CardContent>
        
        <div className="p-0">
          {isLoading ? (
            <div className="p-6">
              <CardGridSkeleton count={4} />
            </div>
          ) : isError ? (
            <div className="p-6">
              <ErrorBanner message={error?.response?.data?.message || 'Failed to load questions.'} />
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={HelpCircle}
                title="No questions found"
                description={search || subjectFilter !== 'ALL' 
                  ? "Try adjusting your search or filters." 
                  : "You haven't created any questions yet. Start building your question bank!"}
                action={!(search || subjectFilter !== 'ALL') && (
                  <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700">
                    Create your first question
                  </Button>
                )}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Question</th>
                    <th className="px-6 py-4 font-semibold">Subject</th>
                    <th className="px-6 py-4 font-semibold text-center">Correct</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-[300px] truncate font-medium text-foreground" title={q.question}>
                          {q.question}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[300px] mt-1">
                          A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D: {q.optionD}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          q.subject.category === 'NATURAL' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-orange-200 text-orange-700 bg-orange-50'
                        }>
                          {q.subject.name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex w-6 h-6 items-center justify-center rounded bg-emerald-100 text-emerald-700 font-bold text-xs">
                          {q.correctAnswer}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            onClick={() => openEditModal(q)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                            onClick={() => setDeleteDialog({ isOpen: true, id: q.id })}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <QuestionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        questionToEdit={editingQuestion}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone and will remove it from any mock exams using it."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => deleteMutation.mutate(deleteDialog.id)}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
