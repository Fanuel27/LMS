import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { 
  Search, FileText, ChevronLeft, ChevronRight, 
  Download, Eye, Calendar, User
} from 'lucide-react'

import { studentService } from '@/services/student.service'
import { useToast } from '@/hooks/useToast'

import PageHeader from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import ErrorBanner from '@/components/admin/ErrorBanner'
import EmptyState from '@/components/admin/EmptyState'

export default function StudentNotesPage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSubjectId = searchParams.get('subjectId') || 'ALL'

  // State
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState(initialSubjectId)
  const [sort, setSort] = useState('desc')

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(handler)
  }, [search])

  // Queries
  const { data: subjectsRes } = useQuery({
    queryKey: ['student-subjects-list'],
    queryFn: async () => {
      const res = await studentService.getSubjects()
      return res.data.data
    },
  })

  const { data: notesRes, isLoading, isError, error } = useQuery({
    queryKey: ['student-notes', page, debouncedSearch, subjectFilter, sort],
    queryFn: async () => {
      const res = await studentService.getNotes({
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

  const handleDownload = async (note) => {
    try {
      toast({ description: 'Downloading PDF...' })
      const res = await studentService.downloadNotePdf(note.id)
      
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${note.title}.pdf`)
      document.body.appendChild(link)
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

  // Helper to build file URL for viewing
  const getFileUrl = (filename) => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
    return `${baseUrl}/uploads/${filename}`
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Study Notes"
        description="Access and download study materials provided by your teachers."
      />

      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-center bg-muted/20 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes by title..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value)
                setPage(1)
                if (e.target.value === 'ALL') {
                  searchParams.delete('subjectId')
                  setSearchParams(searchParams)
                } else {
                  setSearchParams({ subjectId: e.target.value })
                }
              }}
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
                  : "No study notes are currently available."}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {notes.map((note) => (
                <Card key={note.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className={
                          note.subject.category === 'NATURAL' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-orange-200 text-orange-700 bg-orange-50'
                        }>
                          {note.subject.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1" title={note.title}>
                        {note.title}
                      </h3>
                      
                      {note.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4" title={note.description}>
                          {note.description}
                        </p>
                      )}

                      <div className="flex items-center text-xs text-muted-foreground mb-4">
                        <User className="w-3 h-3 mr-1" />
                        Uploaded by: {note.uploadedBy.fullName}
                      </div>
                    </div>
                    
                    <div className="border-t border-border bg-muted/20 p-3 flex justify-end gap-2">
                      <a 
                        href={getFileUrl(note.pdfFile)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </a>
                      <Button onClick={() => handleDownload(note)} className="bg-violet-600 hover:bg-violet-700">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </div>
  )
}
