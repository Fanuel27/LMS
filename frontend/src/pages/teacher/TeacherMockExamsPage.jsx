import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Edit2, Trash2, 
  FileText, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Clock
} from 'lucide-react'

import { mockExamService } from '@/services/mockExam.service'
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
import MockExamModal from '@/components/teacher/MockExamModal'

export default function TeacherMockExamsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sort, setSort] = useState('desc')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  
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

  const { data: examsRes, isLoading, isError, error } = useQuery({
    queryKey: ['teacher-mock-exams', page, debouncedSearch, subjectFilter, statusFilter, sort],
    queryFn: async () => {
      const res = await mockExamService.getMockExams({
        page,
        limit: 10,
        search: debouncedSearch,
        subjectId: subjectFilter === 'ALL' ? undefined : subjectFilter,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        sort
      })
      return res.data.data
    },
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: mockExamService.deleteMockExam,
    onSuccess: () => {
      toast({ description: 'Mock exam deleted successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-mock-exams'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      setDeleteDialog({ isOpen: false, id: null })
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to delete mock exam', variant: 'destructive' })
      setDeleteDialog({ isOpen: false, id: null })
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, data }) => mockExamService.updateMockExam(id, data),
    onSuccess: () => {
      toast({ description: 'Exam status updated' })
      queryClient.invalidateQueries({ queryKey: ['teacher-mock-exams'] })
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to update status', variant: 'destructive' })
    }
  })

  const handleToggleStatus = (exam) => {
    // If updating only isActive, we still need to send the required fields to update, 
    // or the backend needs to support partial updates. Our validator uses `.optional()` for update fields!
    toggleStatusMutation.mutate({
      id: exam.id,
      data: { isActive: !exam.isActive }
    })
  }

  const openCreateModal = () => {
    setEditingExam(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (exam) => {
    try {
      toast({ description: 'Loading exam details...' })
      const res = await mockExamService.getMockExam(exam.id)
      setEditingExam(res.data.data)
      setIsModalOpen(true)
    } catch (err) {
      toast({ description: 'Failed to load exam details.', variant: 'destructive' })
    }
  }

  const exams = examsRes?.exams || []
  const pagination = examsRes?.pagination || { totalPages: 1 }
  const subjects = subjectsRes || []

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Mock Exams"
        description="Create and manage comprehensive mock exams for your students."
        actions={
          <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-center bg-muted/20 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search exams..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
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
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
              <option value="alpha">Alphabetical</option>
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
              <ErrorBanner message={error?.response?.data?.message || 'Failed to load mock exams.'} />
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={FileText}
                title="No mock exams found"
                description={search || subjectFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? "Try adjusting your search or filters." 
                  : "You haven't created any mock exams yet. Start assembling questions!"}
                action={!(search || subjectFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700">
                    Create your first exam
                  </Button>
                )}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Title</th>
                    <th className="px-6 py-4 font-semibold">Subject</th>
                    <th className="px-6 py-4 font-semibold">Details</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-[200px] truncate font-medium text-foreground" title={exam.title}>
                          {exam.title}
                        </div>
                        {exam.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-1" title={exam.description}>
                            {exam.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          exam.subject.category === 'NATURAL' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-orange-200 text-orange-700 bg-orange-50'
                        }>
                          {exam.subject.name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {exam._count.questions} Qs | {exam._count.questions} Marks</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.durationMinutes} mins</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={exam.isActive ? "default" : "secondary"} className={exam.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' : ''}>
                          {exam.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(exam.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            onClick={() => handleToggleStatus(exam)}
                            title={exam.isActive ? "Deactivate" : "Activate"}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {exam.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ml-2"
                            onClick={() => openEditModal(exam)}
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                            onClick={() => setDeleteDialog({ isOpen: true, id: exam.id })}
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
      <MockExamModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        examToEdit={editingExam}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title="Delete Mock Exam"
        message="Are you sure you want to delete this mock exam? This action cannot be undone."
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
