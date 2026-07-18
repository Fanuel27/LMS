import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  GraduationCap, Plus, Search, Pencil, Trash2,
  CheckCircle2, XCircle, Eye, EyeOff
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { userService } from '@/services/user.service'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Toaster } from '@/components/ui/Toaster'
import PageHeader from '@/components/admin/PageHeader'
import EmptyState from '@/components/admin/EmptyState'
import ErrorBanner from '@/components/admin/ErrorBanner'
import { TableSkeleton } from '@/components/admin/LoadingSkeleton'
import { useConfirm } from '@/components/admin/ConfirmDialog'
import { cn } from '@/lib/utils'

const BREADCRUMBS = [{ label: 'Dashboard', href: '/admin/dashboard' }]

// ─── Student Form Modal ───────────────────────────────────────────────────────

function StudentModal({ open, onClose, initial, onSave, isSaving }) {
  const isEdit = !!initial
  const [showPw, setShowPw] = useState(false)

  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm({
    defaultValues: initial
      ? { fullName: initial.fullName, email: initial.email }
      : {},
  })

  if (!open) return null

  const onSubmit = (data) => {
    onSave(data)
    reset()
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-modal-title"
      >
        <h2 id="student-modal-title" className="text-lg font-semibold text-foreground mb-5">
          {isEdit ? 'Edit Student' : 'Add New Student'}
        </h2>

        <form id="student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="s-fullName">Full Name</Label>
            <Input
              id="s-fullName"
              placeholder="Abebe Girma"
              disabled={isSaving}
              {...register('fullName', { required: 'Full name is required.' })}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="s-email">Email Address</Label>
            <Input
              id="s-email"
              type="email"
              placeholder="student@school.edu.et"
              disabled={isSaving}
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address.' },
              })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password (create only) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="s-password">Password</Label>
              <div className="relative">
                <Input
                  id="s-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  disabled={isSaving}
                  className="pr-10"
                  {...register('password', {
                    required: 'Password is required.',
                    minLength: { value: 8, message: 'Password must be at least 8 characters.' },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw((p) => !p)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button id="student-save-btn" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Students Table Row ───────────────────────────────────────────────────────

function StudentRow({ student, onEdit, onDelete }) {
  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      {/* Avatar + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {student.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">{student.fullName}</span>
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
        {student.email}
      </td>

      {/* Status */}
      <td className="px-4 py-3 hidden md:table-cell">
        <Badge
          variant="outline"
          className={cn(
            'gap-1 text-xs',
            student.isActive
              ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
              : 'border-rose-200 text-rose-700 bg-rose-50'
          )}
        >
          {student.isActive
            ? <CheckCircle2 className="w-3 h-3" />
            : <XCircle className="w-3 h-3" />
          }
          {student.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>

      {/* Joined */}
      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
        {new Date(student.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="relative flex items-center justify-end gap-1">
          <Button
            id={`edit-student-${student.id}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(student)}
            aria-label="Edit student"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            id={`delete-student-${student.id}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(student)}
            aria-label="Delete student"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─── AdminStudentsPage ────────────────────────────────────────────────────────

export default function AdminStudentsPage() {
  const { toasts, toast } = useToast()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const LIMIT = 10

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-students', page, search],
    queryFn: async () => {
      const res = await userService.getStudents({ page, limit: LIMIT, search })
      return res.data
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

  const students = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body) => userService.createStudent(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setModalOpen(false)
      toast({ title: 'Student created', description: 'New student account is ready.', variant: 'default' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to create student.',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      setModalOpen(false)
      setEditing(null)
      toast({ title: 'Student updated', description: 'Changes saved successfully.' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update student.',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast({ title: 'Student deleted', description: 'Account removed from the platform.' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete student.',
        variant: 'destructive',
      })
    },
  })

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleAdd = () => { setEditing(null); setModalOpen(true) }

  const handleEdit = (student) => { setEditing(student); setModalOpen(true) }

  const handleSave = (formData) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = async (student) => {
    const confirmed = await confirm({
      title: 'Delete Student?',
      description: `This will permanently remove "${student.fullName}" and all their data.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (confirmed) deleteMutation.mutate(student.id)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Students"
        description={`${total.toLocaleString()} student${total !== 1 ? 's' : ''} registered`}
        breadcrumbs={BREADCRUMBS}
        actions={
          <Button id="add-student-btn" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        }
      />

      {isError && (
        <ErrorBanner message="Failed to load students." onRetry={refetch} />
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="student-search-input"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button id="student-search-btn" type="submit" variant="outline" size="icon">
          <Search className="w-4 h-4" />
          <span className="sr-only">Search</span>
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
            aria-label="Clear search"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        )}
      </form>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={LIMIT} cols={5} />
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={search ? 'No students found' : 'No students yet'}
              description={
                search
                  ? `No results for "${search}". Try a different search term.`
                  : 'Get started by adding the first student.'
              }
              action={
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4" />
                  Add Student
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <StudentRow
                      key={s.id}
                      student={s}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  id="students-prev-page"
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  id="students-next-page"
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <StudentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        initial={editing}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Confirm dialog */}
      <ConfirmDialog />

      <Toaster toasts={toasts} />
    </div>
  )
}
