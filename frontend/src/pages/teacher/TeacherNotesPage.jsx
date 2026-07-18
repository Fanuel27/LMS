import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Edit2, Trash2,
  FileText, ChevronLeft, ChevronRight, Download, Eye
} from 'lucide-react'

import { noteService } from '@/services/note.service'
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
import NoteModal from '@/components/teacher/NoteModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const UPLOADS_URL = API_URL.replace('/api', '/uploads')

export default function TeacherNotesPage() {
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
  const [editingNote, setEditingNote] = useState(null)

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

  const { data: notesRes, isLoading, isError, error } = useQuery({
    queryKey: ['teacher-notes', page, debouncedSearch, subjectFilter, sort],
    queryFn: async () => {
      const res = await noteService.getNotes({
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
    mutationFn: noteService.deleteNote,
    onSuccess: () => {
      toast({ description: 'Note deleted successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-notes'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      setDeleteDialog({ isOpen: false, id: null })
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to delete note', variant: 'destructive' })
      setDeleteDialog({ isOpen: false, id: null })
    }
  })

  const openCreateModal = () => {
    setEditingNote(null)
    setIsModalOpen(true)
  }

  const openEditModal = (n) => {
    setEditingNote(n)
    setIsModalOpen(true)
  }

  const handleDownload = async (n) => {
    try {
      toast({ description: 'Starting download...' })
      const res = await noteService.downloadNotePdf(n.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${n.title}.pdf`)
      document.body.appendChild(link)
      // link.click()
      // link.remove()
      // window.URL.revokeObjectURL(url)
      link.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        link.remove()
      }, 2000)
    } catch (err) {
      toast({ description: 'Failed to download PDF', variant: 'destructive' })
    }
  }

  const notes = notesRes?.notes || []
  const pagination = notesRes?.pagination || { totalPages: 1 }
  const subjects = subjectsRes || []

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Study Notes"
        description="Upload and manage PDF study materials for your students."
        actions={
          <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Upload Note
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
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
              <ErrorBanner message={error?.response?.data?.message || 'Failed to load notes.'} />
            </div>
          ) : notes.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={FileText}
                title="No notes found"
                description={search || subjectFilter !== 'ALL'
                  ? "Try adjusting your search or filters."
                  : "You haven't uploaded any study notes yet. Start sharing knowledge!"}
                action={!(search || subjectFilter !== 'ALL') && (
                  <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700">
                    Upload your first note
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
                    <th className="px-6 py-4 font-semibold">PDF File</th>
                    <th className="px-6 py-4 font-semibold">Uploaded</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {notes.map((n) => (
                    <tr key={n.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-[250px] truncate font-medium text-foreground" title={n.title}>
                          {n.title}
                        </div>
                        {n.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[250px] mt-1" title={n.description}>
                            {n.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          n.subject.category === 'NATURAL' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-orange-200 text-orange-700 bg-orange-50'
                        }>
                          {n.subject.name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate text-muted-foreground" title={n.pdfFile}>{n.pdfFile}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`${UPLOADS_URL}/${n.pdfFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="View PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDownload(n)}
                            className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ml-2"
                            onClick={() => openEditModal(n)}
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                            onClick={() => setDeleteDialog({ isOpen: true, id: n.id })}
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
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        noteToEdit={editingNote}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title="Delete Note"
        message="Are you sure you want to delete this study note? This will permanently remove the PDF file."
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
