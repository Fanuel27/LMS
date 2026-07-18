import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/hooks/useToast'
import { noteService } from '@/services/note.service'
import { teacherService } from '@/services/user.service'

const noteSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required.'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  // pdfFile is handled manually outside react-hook-form string fields
})

export default function NoteModal({ isOpen, onClose, noteToEdit = null }) {
  const isEdit = !!noteToEdit
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: subjectsData } = useQuery({
    queryKey: ['teacher-subjects-list'],
    queryFn: async () => {
      const res = await teacherService.getSubjects()
      return res.data.data
    },
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      subjectId: '',
      title: '',
      description: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (isEdit && noteToEdit) {
        reset({
          subjectId: noteToEdit.subjectId,
          title: noteToEdit.title,
          description: noteToEdit.description || '',
        })
      } else {
        reset({
          subjectId: '',
          title: '',
          description: '',
        })
      }
    }
  }, [isOpen, isEdit, noteToEdit, reset])

  const createMutation = useMutation({
    mutationFn: noteService.createNote,
    onSuccess: () => {
      toast({ description: 'Note uploaded successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-notes'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      onClose()
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to upload note', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => noteService.updateNote(noteToEdit.id, data),
    onSuccess: () => {
      toast({ description: 'Note updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-notes'] })
      onClose()
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to update note', variant: 'destructive' })
    },
  })

  const onSubmit = (data) => {
    const fileInput = document.getElementById('pdfFile')
    const file = fileInput?.files?.[0]

    if (!isEdit && !file) {
      toast({ description: 'Please select a PDF file to upload.', variant: 'destructive' })
      return
    }

    if (file && file.type !== 'application/pdf') {
      toast({ description: 'Only PDF files are allowed.', variant: 'destructive' })
      return
    }

    if (file && file.size > 10 * 1024 * 1024) {
      toast({ description: 'File size must be less than 10MB.', variant: 'destructive' })
      return
    }

    const formData = new FormData()
    formData.append('subjectId', data.subjectId)
    formData.append('title', data.title)
    formData.append('description', data.description || '')
    if (file) {
      formData.append('pdfFile', file)
    }

    if (isEdit) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {isEdit ? 'Edit Note' : 'Upload Study Note'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="note-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject <span className="text-destructive">*</span></Label>
              <select
                id="subjectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('subjectId')}
              >
                <option value="">Select a subject...</option>
                {subjectsData?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              {errors.subjectId && <p className="text-sm text-destructive">{errors.subjectId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Chapter 1 Summary"
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                placeholder="Brief description of the contents..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfFile">
                PDF File {isEdit ? '(Leave blank to keep existing file)' : <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="pdfFile"
                type="file"
                accept="application/pdf"
                className="cursor-pointer file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum file size: 10MB.</p>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 shrink-0 flex items-center justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="note-form" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Upload Note'}
          </Button>
        </div>
      </div>
    </div>
  )
}
