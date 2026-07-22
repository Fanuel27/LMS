import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Megaphone, Plus, Search, Pencil, Trash2, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { adminAnnouncementService } from '@/services/adminAnnouncement.service'
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
const LIMIT = 10

// ─── Sorting helpers ──────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
  return sortDir === 'asc'
    ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    : <ArrowDown className="w-3 h-3 ml-1 text-primary" />
}

function SortableTh({ label, field, sortField, sortDir, onSort, className }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors',
        className
      )}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </th>
  )
}

// ─── Announcement Modal (Create / Edit) ───────────────────────────────────────

function AnnouncementModal({ open, onClose, initial, onSave, isSaving }) {
  const isEdit = !!initial

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { title: '', message: '', type: 'INFO' },
  })

  useEffect(() => {
    if (initial) {
      reset({ title: initial.title, message: initial.message, type: initial.type })
    } else {
      reset({ title: '', message: '', type: 'INFO' })
    }
  }, [initial, reset])

  if (!open) return null

  const onSubmit = (data) => { onSave(data); reset() }
  const handleClose = () => { reset(); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div
        className="relative z-10 bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg p-6"
        role="dialog" aria-modal="true" aria-labelledby="announcement-modal-title"
      >
        <h2 id="announcement-modal-title" className="text-lg font-semibold text-foreground mb-5">
          {isEdit ? 'Edit Announcement' : 'Create System Announcement'}
        </h2>

        <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="a-title">Title</Label>
            <Input
              id="a-title"
              placeholder="System Maintenance..."
              disabled={isSaving}
              {...register('title', {
                required: 'Title is required.',
                maxLength: { value: 255, message: 'Max length 255 characters.' }
              })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="a-type">Type</Label>
            <select
              id="a-type"
              className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              {...register('type', { required: 'Type is required.' })}
            >
              <option value="INFO">INFO (Blue)</option>
              <option value="SUCCESS">SUCCESS (Green)</option>
              <option value="WARNING">WARNING (Yellow)</option>
              <option value="ERROR">ERROR (Red)</option>
            </select>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="a-message">Message</Label>
            <textarea
              id="a-message"
              className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Details about the announcement..."
              disabled={isSaving}
              {...register('message', {
                required: 'Message is required.',
              })}
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>Cancel</Button>
            <Button id="announcement-save-btn" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────

function AnnouncementRow({ announcement, onEdit, onDelete }) {
  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground line-clamp-1 max-w-[200px]">{announcement.title}</span>
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
        <span className="line-clamp-2">{announcement.message}</span>
      </td>

      <td className="px-4 py-3 hidden md:table-cell">
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            announcement.type === 'INFO' && 'text-blue-700 bg-blue-50 border-blue-200',
            announcement.type === 'SUCCESS' && 'text-green-700 bg-green-50 border-green-200',
            announcement.type === 'WARNING' && 'text-amber-700 bg-amber-50 border-amber-200',
            announcement.type === 'ERROR' && 'text-rose-700 bg-rose-50 border-rose-200',
            (!['INFO', 'SUCCESS', 'WARNING', 'ERROR'].includes(announcement.type)) && 'text-muted-foreground bg-muted'
          )}
        >
          {announcement.type}
        </Badge>
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
        {new Date(announcement.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => onEdit(announcement)}
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(announcement)}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─── AdminAnnouncementsPage ──────────────────────────────────────────────────

export default function AdminAnnouncementsPage() {
  const { toasts, toast } = useToast()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  
  // Note: Backend currently only supports sorting by createdAt (desc/asc), but we implement local toggle for UI completeness.
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-announcements', page, search, typeFilter, sortDir],
    queryFn: async () => {
      const res = await adminAnnouncementService.getAnnouncements({ page, limit: LIMIT, search, type: typeFilter, sort: sortDir })
      return res.data
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

  const announcements = data?.data?.announcements ?? []
  const total = data?.data?.pagination?.total ?? 0
  const totalPages = data?.data?.pagination?.totalPages ?? 0

  // ── Sort toggle ────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (field !== 'createdAt') return // only sort by date for now
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body) => adminAnnouncementService.createAnnouncement(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-feed'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      setModalOpen(false)
      toast({ title: 'Announcement created', description: 'Published successfully.' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to create announcement.',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAnnouncementService.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-feed'] })
      setModalOpen(false)
      setEditing(null)
      toast({ title: 'Announcement updated', description: 'Changes saved successfully.' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update announcement.',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAnnouncementService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-feed'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      toast({ title: 'Announcement deleted', description: 'Removed from the system.' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete announcement.',
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
  const handleEdit = (announcement) => { setEditing(announcement); setModalOpen(true) }

  const handleSave = (formData) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = async (announcement) => {
    const confirmed = await confirm({
      title: 'Delete Announcement?',
      description: `This will permanently remove "${announcement.title}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (confirmed) deleteMutation.mutate(announcement.id)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Announcements"
        description={`Manage system-wide broadcasts`}
        breadcrumbs={BREADCRUMBS}
        actions={
          <Button id="add-announcement-btn" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        }
      />

      {isError && <ErrorBanner message="Failed to load announcements." onRetry={refetch} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 max-w-3xl">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="announcement-search-input"
              placeholder="Search title or message…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="icon">
            <Search className="w-4 h-4" />
            <span className="sr-only">Search</span>
          </Button>
          {search && (
            <Button
              type="button" variant="ghost" size="icon"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              aria-label="Clear search"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </form>
        
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="flex h-10 w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ALL">All Types</option>
          <option value="INFO">INFO</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>

      {/* Table card */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><TableSkeleton rows={LIMIT} cols={5} /></div>
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title={search ? 'No announcements found' : 'No announcements yet'}
              description={
                search
                  ? `No results for "${search}". Try a different term.`
                  : 'Get started by creating the first system announcement.'
              }
              action={
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4" />
                  New Announcement
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Message</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Type</th>
                    <SortableTh label="Date" field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => (
                    <AnnouncementRow
                      key={a.id}
                      announcement={a}
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
                  variant="outline" size="sm"
                  disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <AnnouncementModal
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
