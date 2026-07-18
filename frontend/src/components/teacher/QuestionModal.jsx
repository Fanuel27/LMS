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
import { questionService } from '@/services/question.service'
import { teacherService } from '@/services/user.service'

const questionSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required.'),
  question: z.string().min(5, 'Question must be at least 5 characters.'),
  optionA: z.string().min(1, 'Option A is required.'),
  optionB: z.string().min(1, 'Option B is required.'),
  optionC: z.string().min(1, 'Option C is required.'),
  optionD: z.string().min(1, 'Option D is required.'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D'], { required_error: 'Correct answer is required.' }),
  explanation: z.string().optional(),
})

export default function QuestionModal({ isOpen, onClose, questionToEdit = null }) {
  const isEdit = !!questionToEdit
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
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
    resolver: zodResolver(questionSchema),
    defaultValues: {
      subjectId: '',
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (isEdit && questionToEdit) {
        reset({
          subjectId: questionToEdit.subjectId,
          question: questionToEdit.question,
          optionA: questionToEdit.optionA,
          optionB: questionToEdit.optionB,
          optionC: questionToEdit.optionC,
          optionD: questionToEdit.optionD,
          correctAnswer: questionToEdit.correctAnswer,
          explanation: questionToEdit.explanation || '',
        })
      } else {
        reset({
          subjectId: '',
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A',
          explanation: '',
        })
      }
    }
  }, [isOpen, isEdit, questionToEdit, reset])

  const createMutation = useMutation({
    mutationFn: questionService.createQuestion,
    onSuccess: () => {
      toast({ description: 'Question created successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      onClose()
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to create question', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => questionService.updateQuestion(questionToEdit.id, data),
    onSuccess: () => {
      toast({ description: 'Question updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] })
      onClose()
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to update question', variant: 'destructive' })
    },
  })

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {isEdit ? 'Edit Question' : 'Create New Question'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="question-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject <span className="text-destructive">*</span></Label>
              <select
                id="subjectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <Label htmlFor="question">Question Text <span className="text-destructive">*</span></Label>
              <textarea
                id="question"
                placeholder="Enter the question text here..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('question')}
              />
              {errors.question && <p className="text-sm text-destructive">{errors.question.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="optionA">Option A <span className="text-destructive">*</span></Label>
                <Input id="optionA" {...register('optionA')} />
                {errors.optionA && <p className="text-sm text-destructive">{errors.optionA.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="optionB">Option B <span className="text-destructive">*</span></Label>
                <Input id="optionB" {...register('optionB')} />
                {errors.optionB && <p className="text-sm text-destructive">{errors.optionB.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="optionC">Option C <span className="text-destructive">*</span></Label>
                <Input id="optionC" {...register('optionC')} />
                {errors.optionC && <p className="text-sm text-destructive">{errors.optionC.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="optionD">Option D <span className="text-destructive">*</span></Label>
                <Input id="optionD" {...register('optionD')} />
                {errors.optionD && <p className="text-sm text-destructive">{errors.optionD.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="correctAnswer">Correct Answer <span className="text-destructive">*</span></Label>
              <select
                id="correctAnswer"
                className="flex h-10 w-full sm:w-1/2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('correctAnswer')}
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
              {errors.correctAnswer && <p className="text-sm text-destructive">{errors.correctAnswer.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <textarea
                id="explanation"
                placeholder="Explain why the answer is correct..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('explanation')}
              />
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 shrink-0 flex items-center justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="question-form" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Question'}
          </Button>
        </div>
      </div>
    </div>
  )
}
