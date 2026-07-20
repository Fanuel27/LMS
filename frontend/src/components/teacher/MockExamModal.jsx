import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, X, Search, CheckSquare, Square } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/hooks/useToast'
import { mockExamService } from '@/services/mockExam.service'
import { teacherService } from '@/services/user.service'
import { questionService } from '@/services/question.service'

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  durationMinutes: z.number({ coerce: true }).int().min(1, 'Duration must be at least 1 minute.'),
  passingScore: z.number({ coerce: true }).min(0, 'Passing score must be at least 0.'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export default function MockExamModal({ isOpen, onClose, examToEdit = null }) {
  const isEdit = !!examToEdit
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [questionSearch, setQuestionSearch] = useState('')

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
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      subjectId: '',
      durationMinutes: 60,
      passingScore: 50,
      description: '',
      isActive: true,
    },
  })

  const selectedSubjectId = watch('subjectId')

  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['teacher-questions', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return { questions: [] }
      const res = await questionService.getQuestions({
        subjectId: selectedSubjectId,
        limit: 1000,
      })
      return res.data.data
    },
    enabled: isOpen && !!selectedSubjectId,
  })

  // Load edit data
  useEffect(() => {
    if (isOpen) {
      if (isEdit && examToEdit) {
        reset({
          title: examToEdit.title,
          subjectId: examToEdit.subjectId,
          durationMinutes: examToEdit.durationMinutes,
          passingScore: examToEdit.passingScore,
          description: examToEdit.description || '',
          isActive: examToEdit.isActive,
        })
        
        if (examToEdit.questions) {
          setSelectedQuestions(examToEdit.questions.map(q => q.questionId))
        }
      } else {
        reset({
          title: '',
          subjectId: '',
          durationMinutes: 60,
          passingScore: 50,
          description: '',
          isActive: true,
        })
        setSelectedQuestions([])
      }
    }
  }, [isOpen, isEdit, examToEdit, reset])

  const createMutation = useMutation({
    mutationFn: mockExamService.createMockExam,
    onSuccess: () => {
      toast({ description: 'Mock exam created successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-mock-exams'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      onClose()
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to create mock exam', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => mockExamService.updateMockExam(examToEdit.id, data),
    onSuccess: () => {
      toast({ description: 'Mock exam updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['teacher-mock-exams'] })
      onClose()
    },
    onError: (err) => {
      toast({ description: err.response?.data?.message || 'Failed to update mock exam', variant: 'destructive' })
    },
  })

  const toggleQuestion = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const selectAll = () => {
    if (!questionsData?.questions) return
    const allIds = questionsData.questions.map(q => q.id)
    setSelectedQuestions(allIds)
  }

  const clearSelection = () => {
    setSelectedQuestions([])
  }

  const onSubmit = (data) => {
    if (selectedQuestions.length === 0) {
      toast({ description: 'Please select at least one question.', variant: 'destructive' })
      return
    }

    const payload = {
      ...data,
      questionIds: selectedQuestions
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const filteredQuestions = questionsData?.questions?.filter(q => 
    q.question.toLowerCase().includes(questionSearch.toLowerCase())
  ) || []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {isEdit ? 'Edit Mock Exam' : 'Create Mock Exam'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Form */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-border">
            <form id="mock-exam-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g. Midterm 1 - Natural Sciences"
                  {...register('title')}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (mins) <span className="text-destructive">*</span></Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="1"
                    {...register('durationMinutes')}
                  />
                  {errors.durationMinutes && <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score <span className="text-destructive">*</span></Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    {...register('passingScore')}
                  />
                  {errors.passingScore && <p className="text-sm text-destructive">{errors.passingScore.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  placeholder="Instructions or exam details..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('description')}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                  {...register('isActive')}
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                  Make this exam active and visible to students immediately
                </Label>
              </div>

              {/* Stats Preview */}
              <div className="p-4 bg-muted/40 rounded-lg border border-border mt-6">
                <h4 className="text-sm font-semibold mb-2">Exam Summary</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Questions:</span>
                  <span className="font-bold">{selectedQuestions.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Total Marks:</span>
                  <span className="font-bold">{selectedQuestions.length}</span>
                </div>
                {selectedQuestions.length === 0 && (
                  <p className="text-xs text-destructive mt-2">Please select questions from the panel.</p>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Question Selection */}
          <div className="w-full md:w-1/2 flex flex-col overflow-hidden bg-muted/10">
            <div className="p-4 border-b border-border space-y-4 shrink-0">
              <h3 className="font-semibold flex items-center justify-between">
                Question Bank
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                  {selectedQuestions.length} selected
                </span>
              </h3>
              
              {!selectedSubjectId ? (
                <p className="text-sm text-muted-foreground">Please select a subject to load questions.</p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      className="pl-9 h-9"
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button type="button" onClick={selectAll} className="text-emerald-600 hover:underline">Select All</button>
                    <span>&bull;</span>
                    <button type="button" onClick={clearSelection} className="text-muted-foreground hover:underline">Clear</button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLoadingQuestions ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
                </div>
              ) : !selectedSubjectId ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
                  Questions will appear here once a subject is chosen.
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No questions found for this subject.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map((q) => {
                    const isSelected = selectedQuestions.includes(q.id)
                    return (
                      <div 
                        key={q.id}
                        onClick={() => toggleQuestion(q.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-card border-border hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0 text-emerald-600">
                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                          </div>
                          <div className="text-sm line-clamp-2" title={q.question}>
                            {q.question}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 shrink-0 flex items-center justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="mock-exam-form" disabled={isPending || selectedQuestions.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Exam'}
          </Button>
        </div>
      </div>
    </div>
  )
}
