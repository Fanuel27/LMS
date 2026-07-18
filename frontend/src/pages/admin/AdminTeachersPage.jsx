import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  Users, Plus, Search, Pencil, Trash2,
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

// ─── Teacher Form Modal ───────────────────────────────────────────────────────

function TeacherModal({ open, onClose, initial, onSave, isSaving }) {
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

  const onSubmit = (data) => { onSave(data); reset() }
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
        aria-labelledby="teacher-modal-title"
      >
        <h2 id="teacher-modal-title" className="text-lg font-semibold text-foreground mb-5">
          {isEdit ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>

        <form id="teacher-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="t-fullName">Full Name</Label>
            <Input
              id="t-fullName"
              placeholder="Tigist Haile"
              disabled={isSaving}
              {...register('fullName', { required: 'Full name is required.' })}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-email">Email Address</Label>
            <Input
              id="t-email"
              type="email"
              placeholder="teacher@school.edu.et"
              disabled={isSaving}
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email.' },
              })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="t-password">Password</Label>
              <div className="relative">
                <Input
                  id="t-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  disabled={isSaving}
                  className="pr-10"
                  {...register('password', {
                    required: 'Password is required.',
                    minLength: { value: 8, message: 'At least 8 characters.' },
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button id="teacher-save-btn" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Teacher'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Teacher Row ──────────────────────────────────────────────────────────────

function TeacherRow({ teacher, onEdit, onDelete }) {
  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {teacher.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">{teacher.fullName}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{teacher.email}</td>
      <td className="px-4 py-3 hidden md:table-cell">
        <Badge
          variant="outline"
          className={cn(
            'gap-1 text-xs',
            teacher.isActive
              ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
              : 'border-rose-200 text-rose-700 bg-rose-50'
          )}
        >
          {teacher.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {teacher.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
        {new Date(teacher.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            id={`edit-teacher-${teacher.id}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(teacher)}
            aria-label="Edit teacher"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            id={`delete-teacher-${teacher.id}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(teacher)}
            aria-label="Delete teacher"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─── AdminTeachersPage ────────────────────────────────────────────────────────

export default function AdminTeachersPage() {
  const { toasts, toast } = useToast()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const LIMIT = 10

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-teachers', page, search],
    queryFn: async () => {
      const res = await userService.getTeachers({ page, limit: LIMIT, search })
      return res.data
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

  const teachers = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  const createMutation = useMutation({
    mutationFn: (body) => userService.createTeacher(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setModalOpen(false)
      toast({ title: 'Teacher created', description: 'New teacher account is ready.' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to create teacher.',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] })
      setModalOpen(false)
      setEditing(null)
      toast({ title: 'Teacher updated', description: 'Changes saved successfully.' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update teacher.',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast({ title: 'Teacher deleted', description: 'Account removed from the platform.' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete teacher.',
        variant: 'destructive',
      })
    },
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleAdd = () => { setEditing(null); setModalOpen(true) }
  const handleEdit = (teacher) => { setEditing(teacher); setModalOpen(true) }

  const handleSave = (formData) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = async (teacher) => {
    const confirmed = await confirm({
      title: 'Delete Teacher?',
      description: `This will permanently remove "${teacher.fullName}" and all their content.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (confirmed) deleteMutation.mutate(teacher.id)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Teachers"
        description={`${total.toLocaleString()} teacher${total !== 1 ? 's' : ''} registered`}
        breadcrumbs={BREADCRUMBS}
        actions={
          <Button id="add-teacher-btn" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Add Teacher
          </Button>
        }
      />

      {isError && <ErrorBanner message="Failed to load teachers." onRetry={refetch} />}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="teacher-search-input"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button id="teacher-search-btn" type="submit" variant="outline" size="icon">
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
            <div className="p-6"><TableSkeleton rows={LIMIT} cols={5} /></div>
          ) : teachers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? 'No teachers found' : 'No teachers yet'}
              description={
                search
                  ? `No results for "${search}".`
                  : 'Add the first teacher to get started.'
              }
              action={
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4" />
                  Add Teacher
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <TeacherRow
                      key={t.id}
                      teacher={t}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  id="teachers-prev-page"
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  id="teachers-next-page"
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

      <TeacherModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        initial={editing}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <ConfirmDialog />
      <Toaster toasts={toasts} />
    </div>
  )
}
