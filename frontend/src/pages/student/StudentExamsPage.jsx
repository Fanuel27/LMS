import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { 
  Search, BookOpen, Clock, AlertTriangle, CheckCircle2, 
  XCircle, ChevronLeft, ChevronRight, PlayCircle, Trophy, 
  ArrowRight, ArrowLeft
} from 'lucide-react'

import { studentService } from '@/services/student.service'
import { useToast } from '@/hooks/useToast'
import PageHeader from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import EmptyState from '@/components/admin/EmptyState'

// --- View Constants ---
const VIEW_BROWSE = 'BROWSE'
const VIEW_PRE_EXAM = 'PRE_EXAM'
const VIEW_ACTIVE = 'ACTIVE'
const VIEW_RESULT = 'RESULT'
const VIEW_REVIEW = 'REVIEW'

export default function StudentExamsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // ─── Global State ────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState(VIEW_BROWSE)
  
  // ─── Browse State ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState(searchParams.get('subjectId') || 'ALL')
  const [browsePage, setBrowsePage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

  // ─── Exam Execution State ────────────────────────────────────────────────────
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [examDetails, setExamDetails] = useState(null) // From pre-exam / active
  const [attemptId, setAttemptId] = useState(null)
  const [startedAt, setStartedAt] = useState(null)
  
  // Active exam tracking
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: option }
  const [timeLeft, setTimeLeft] = useState(null) // in seconds
  
  // Results & Review
  const [resultData, setResultData] = useState(null)
  const [reviewData, setReviewData] = useState(null)
  
  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(handler)
  }, [search])

  // ─── Local Storage Recovery ──────────────────────────────────────────────────
  useEffect(() => {
    const savedState = localStorage.getItem('activeMockExam')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // If there's an active attempt, we should try to recover it
        if (parsed.attemptId && parsed.startedAt && parsed.durationMinutes && parsed.examId) {
          // Calculate time elapsed
          const elapsed = Math.floor((new Date().getTime() - new Date(parsed.startedAt).getTime()) / 1000)
          const totalSeconds = parsed.durationMinutes * 60
          
          if (elapsed < totalSeconds) {
            setAttemptId(parsed.attemptId)
            setStartedAt(parsed.startedAt)
            setSelectedExamId(parsed.examId)
            setAnswers(parsed.answers || {})
            setTimeLeft(totalSeconds - elapsed)
            // Fetch exam details to resume
            fetchExamDetailsForRecovery(parsed.examId, parsed.currentQuestionIndex)
          } else {
            // Time is up, clear local storage
            localStorage.removeItem('activeMockExam')
          }
        }
      } catch (e) {
        localStorage.removeItem('activeMockExam')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchExamDetailsForRecovery = async (id, savedIndex) => {
    try {
      const res = await studentService.getMockExamDetails(id)
      const details = res.data.data
      setExamDetails(details)
      
      // Validate savedIndex
      let validIndex = parseInt(savedIndex, 10)
      if (isNaN(validIndex) || validIndex < 0 || validIndex >= details.numberOfQuestions) {
        validIndex = 0
      }
      setCurrentQuestionIndex(validIndex)
      
      setCurrentView(VIEW_ACTIVE)
    } catch (err) {
      toast({ description: 'Failed to recover active exam session.', variant: 'destructive' })
      localStorage.removeItem('activeMockExam')
    }
  }

  // ─── Queries (Browse View) ───────────────────────────────────────────────────
  const { data: subjectsData } = useQuery({
    queryKey: ['student-subjects-list'],
    queryFn: async () => {
      const res = await studentService.getSubjects()
      return res.data.data
    },
    enabled: currentView === VIEW_BROWSE
  })

  const { data: examsRes, isLoading: isLoadingExams } = useQuery({
    queryKey: ['student-mock-exams', browsePage, debouncedSearch, subjectFilter],
    queryFn: async () => {
      const res = await studentService.getMockExams({
        page: browsePage, limit: 6, search: debouncedSearch, 
        subjectId: subjectFilter === 'ALL' ? undefined : subjectFilter
      })
      return res.data.data
    },
    keepPreviousData: true,
    enabled: currentView === VIEW_BROWSE
  })

  const { data: historyRes, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['student-mock-exam-history', historyPage],
    queryFn: async () => {
      const res = await studentService.getMockExamHistory({ page: historyPage, limit: 5 })
      return res.data.data
    },
    keepPreviousData: true,
    enabled: currentView === VIEW_BROWSE
  })

  // ─── Timer Logic ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let timer = null;
    if (currentView === VIEW_ACTIVE && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timer) clearInterval(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, timeLeft])

  // Save answers to local storage continuously
  useEffect(() => {
    if (currentView === VIEW_ACTIVE && attemptId && examDetails) {
      localStorage.setItem('activeMockExam', JSON.stringify({
        attemptId,
        startedAt,
        durationMinutes: examDetails.durationMinutes,
        examId: examDetails.id,
        answers,
        currentQuestionIndex
      }))
    }
  }, [answers, currentView, attemptId, startedAt, examDetails, currentQuestionIndex])

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const startExamMutation = useMutation({
    mutationFn: (id) => studentService.startMockExam(id),
    onSuccess: (res, id) => {
      const data = res.data.data
      setAttemptId(data.attemptId)
      setStartedAt(data.startedAt)
      setTimeLeft(examDetails.durationMinutes * 60)
      setAnswers({})
      setCurrentQuestionIndex(0)
      
      localStorage.setItem('activeMockExam', JSON.stringify({
        attemptId: data.attemptId,
        startedAt: data.startedAt,
        durationMinutes: examDetails.durationMinutes,
        examId: id,
        answers: {},
        currentQuestionIndex: 0
      }))
      
      setCurrentView(VIEW_ACTIVE)
      toast({ description: 'Exam started! Good luck.', className: 'bg-emerald-600 text-white' })
    },
    onError: (err) => {
      toast({ description: err?.response?.data?.message || 'Failed to start exam.', variant: 'destructive' })
    }
  })

  const submitExamMutation = useMutation({
    mutationFn: (data) => studentService.submitMockExam(data.examId, { attemptId: data.attemptId, answers: data.answers }),
    onSuccess: (res) => {
      setResultData(res.data.data)
      localStorage.removeItem('activeMockExam')
      setCurrentView(VIEW_RESULT)
      
      // Refresh stats and history
      queryClient.invalidateQueries(['student-stats'])
      queryClient.invalidateQueries(['student-mock-exam-history'])
    },
    onError: (err) => {
      toast({ description: err?.response?.data?.message || 'Failed to submit exam.', variant: 'destructive' })
    }
  })

  // ─── Action Handlers ─────────────────────────────────────────────────────────
  const handleSelectExam = async (examId) => {
    try {
      const res = await studentService.getMockExamDetails(examId)
      setExamDetails(res.data.data)
      setSelectedExamId(examId)
      setCurrentView(VIEW_PRE_EXAM)
    } catch (err) {
      toast({ description: 'Failed to load exam details.', variant: 'destructive' })
    }
  }

  const handleStartExam = () => {
    startExamMutation.mutate(selectedExamId)
  }

  const handleManualSubmit = () => {
    if (window.confirm("Are you sure you want to submit? You cannot change your answers after submission.")) {
      submitExamMutation.mutate({ examId: selectedExamId, attemptId, answers })
    }
  }

  const handleAutoSubmit = () => {
    toast({ description: "Time is up! Submitting exam automatically." })
    submitExamMutation.mutate({ examId: selectedExamId, attemptId, answers })
  }

  const handleAnswerChange = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleReviewAttempt = async (attemptId) => {
    try {
      const res = await studentService.getMockExamHistoryDetails(attemptId)
      setReviewData(res.data.data)
      setCurrentView(VIEW_REVIEW)
    } catch (err) {
      toast({ description: 'Failed to load review.', variant: 'destructive' })
    }
  }

  // ─── Format Helpers ──────────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    if (seconds === null) return '00:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ─── View 1: BROWSE ──────────────────────────────────────────────────────────
  if (currentView === VIEW_BROWSE) {
    const exams = examsRes?.exams || []
    const pagination = examsRes?.pagination || { totalPages: 1 }
    const history = historyRes?.history || []
    const historyPagination = historyRes?.pagination || { totalPages: 1 }

    return (
      <div className="space-y-10 max-w-7xl">
        <PageHeader 
          title="Mock Examinations" 
          description="Take timed practice tests and evaluate your exam readiness."
        />

        {/* Available Exams */}
        <section>
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <BookOpen className="w-5 h-5 text-violet-600" /> Available Exams
            </h2>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value)
                  setBrowsePage(1)
                  if (e.target.value === 'ALL') {
                    searchParams.delete('subjectId')
                    setSearchParams(searchParams)
                  } else {
                    setSearchParams({ subjectId: e.target.value })
                  }
                }}
              >
                <option value="ALL">All Subjects</option>
                {subjectsData?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingExams ? (
            <CardGridSkeleton count={3} />
          ) : exams.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No exams available"
              description="There are currently no mock exams matching your criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map(exam => (
                <Card key={exam.id} className="hover:shadow-md transition-all flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-border bg-muted/20">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                        {exam.subject.name}
                      </Badge>
                      <Badge variant="secondary" className="font-mono bg-blue-50 text-blue-700 hover:bg-blue-50">
                        {exam.durationMinutes} min
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-lg leading-tight">{exam.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1">
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <p className="flex justify-between"><span>Questions:</span> <span className="font-semibold text-foreground">{exam.numberOfQuestions}</span></p>
                      <p className="flex justify-between"><span>Passing Score:</span> <span className="font-semibold text-foreground">{exam.passingScore}%</span></p>
                      <p className="flex justify-between"><span>Teacher:</span> <span>{exam.teacher.fullName}</span></p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 px-4">
                    <Button onClick={() => handleSelectExam(exam.id)} className="w-full bg-violet-600 hover:bg-violet-700">
                      <PlayCircle className="w-4 h-4 mr-2" /> Start Exam
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {browsePage} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setBrowsePage(p => Math.max(1, p - 1))} disabled={browsePage === 1}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBrowsePage(p => Math.min(pagination.totalPages, p + 1))} disabled={browsePage === pagination.totalPages}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Exam History */}
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground mb-6">
            <Trophy className="w-5 h-5 text-amber-500" /> My Exam History
          </h2>
          <Card>
            <CardContent className="p-0">
              {isLoadingHistory ? (
                <div className="p-6"><CardGridSkeleton count={1} /></div>
              ) : history.length === 0 ? (
                <div className="p-12">
                  <EmptyState icon={Clock} title="No history found" description="You have not completed any mock exams yet." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Subject</th>
                        <th className="px-6 py-4 font-medium">Exam</th>
                        <th className="px-6 py-4 font-medium text-center">Score</th>
                        <th className="px-6 py-4 font-medium text-center">Result</th>
                        <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {history.map(item => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                              {item.subject}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground max-w-[200px] truncate" title={item.examTitle}>
                            {item.examTitle}
                          </td>
                          <td className="px-6 py-4 text-center font-bold">
                            {item.score}%
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.pass ? (
                              <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">PASS</Badge>
                            ) : (
                              <Badge variant="destructive">FAIL</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="outline" size="sm" onClick={() => handleReviewAttempt(item.id)}>
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {historyPagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Page {historyPage} of {historyPagination.totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => Math.min(historyPagination.totalPages, p + 1))} disabled={historyPage === historyPagination.totalPages}>
                          Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    )
  }

  // ─── View 2: PRE-EXAM CONFIRMATION ───────────────────────────────────────────
  if (currentView === VIEW_PRE_EXAM) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="shadow-xl border-violet-100">
          <CardHeader className="bg-violet-600 text-white rounded-t-xl text-center py-8">
            <Badge className="bg-white/20 text-white hover:bg-white/20 mb-4 inline-flex mx-auto border-none">
              {examDetails.subject.name}
            </Badge>
            <CardTitle className="text-3xl font-bold">{examDetails.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {examDetails.description && (
              <div className="bg-muted/30 p-4 rounded-xl text-muted-foreground mb-8 text-sm italic border border-border">
                {examDetails.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Duration</p>
                  <p className="text-xl font-bold text-foreground">{examDetails.durationMinutes} Minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Questions</p>
                  <p className="text-xl font-bold text-foreground">{examDetails.numberOfQuestions}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Passing Score</p>
                  <p className="text-xl font-bold text-foreground">{examDetails.passingScore}%</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Attempts</p>
                  <p className="text-xl font-bold text-foreground">Single Submission</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex gap-3 text-orange-800 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>Once you start the exam, the timer will begin. If you close the page, the timer will continue in the background. The exam will automatically submit when time is up.</p>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0 flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setCurrentView(VIEW_BROWSE)}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-violet-600 hover:bg-violet-700" 
              onClick={handleStartExam}
              disabled={startExamMutation.isPending}
            >
              {startExamMutation.isPending ? 'Starting...' : 'Start Exam Now'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ─── View 3: ACTIVE EXAM ─────────────────────────────────────────────────────
  if (currentView === VIEW_ACTIVE && examDetails) {
    const question = examDetails.questions[currentQuestionIndex]
    const answeredCount = Object.keys(answers).length
    const progressPercent = (answeredCount / examDetails.numberOfQuestions) * 100
    const isWarning = timeLeft < 300 // 5 minutes remaining warning
    
    return (
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                {examDetails.subject.name}
              </Badge>
              <span className="font-bold text-foreground">{examDetails.title}</span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-xl font-bold px-3 py-1 rounded-md ${isWarning ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted text-foreground'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>

          <Card className="shadow-md">
            <CardHeader className="border-b border-border bg-muted/20 pb-4">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Question {currentQuestionIndex + 1} of {examDetails.numberOfQuestions}
              </div>
              <CardTitle className="text-xl md:text-2xl leading-relaxed font-semibold">
                {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optionKey = `option${opt}`
                  const optionText = question[optionKey]
                  const isSelected = answers[question.id] === opt
                  
                  return (
                    <div 
                      key={opt}
                      onClick={() => handleAnswerChange(question.id, opt)}
                      className={`relative p-5 rounded-xl border-2 transition-all flex items-center gap-4 cursor-pointer
                        ${isSelected 
                          ? 'border-violet-600 bg-violet-50 text-violet-900 ring-1 ring-violet-600' 
                          : 'border-border hover:border-violet-300 hover:bg-muted/50 text-foreground'}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2
                        ${isSelected ? 'bg-violet-600 border-violet-600 text-white' : 'border-muted-foreground/30 text-muted-foreground'}
                      `}>
                        {opt}
                      </div>
                      <div className="flex-1 font-medium text-[16px]">
                        {optionText}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="min-w-[120px]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                
                <Button 
                  onClick={() => setCurrentQuestionIndex(p => Math.min(examDetails.numberOfQuestions - 1, p + 1))}
                  disabled={currentQuestionIndex === examDetails.numberOfQuestions - 1}
                  className="min-w-[120px] bg-violet-600 hover:bg-violet-700"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Palette */}
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardHeader className="p-4 border-b border-border bg-muted/20">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Question Palette</span>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">{answeredCount} / {examDetails.numberOfQuestions}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {examDetails.questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id]
                  const isCurrent = idx === currentQuestionIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`
                        w-10 h-10 rounded-md text-sm font-bold flex items-center justify-center border transition-all
                        ${isCurrent ? 'ring-2 ring-violet-600 ring-offset-1' : ''}
                        ${isAnswered ? 'bg-violet-600 border-violet-600 text-white' : 'bg-background border-border text-muted-foreground hover:bg-muted'}
                      `}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-border">
              <Button 
                variant="destructive" 
                className="w-full font-bold shadow-sm"
                onClick={handleManualSubmit}
                disabled={submitExamMutation.isPending}
              >
                {submitExamMutation.isPending ? 'Submitting...' : 'Submit Exam'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // ─── View 4: EXAM RESULT ─────────────────────────────────────────────────────
  if (currentView === VIEW_RESULT && resultData) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className={`text-center shadow-lg border-t-8 ${resultData.passed ? 'border-t-emerald-500' : 'border-t-destructive'}`}>
          <CardContent className="p-10 flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${resultData.passed ? 'bg-emerald-100' : 'bg-destructive/10'}`}>
              {resultData.passed ? <Trophy className="w-10 h-10 text-emerald-600" /> : <XCircle className="w-10 h-10 text-destructive" />}
            </div>
            
            <h2 className="text-4xl font-black text-foreground mb-2 tracking-tight">
              {resultData.passed ? 'Congratulations!' : 'Keep Practicing'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              You scored <span className="font-bold text-foreground">{resultData.score}%</span> on this exam.
            </p>
            
            <div className="grid grid-cols-3 gap-4 w-full mb-8">
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <p className="text-2xl font-bold text-foreground">{resultData.totalQuestions}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Total</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-2xl font-bold text-emerald-600">{resultData.correctAnswers}</p>
                <p className="text-xs font-bold text-emerald-700/70 uppercase tracking-wider mt-1">Correct</p>
              </div>
              <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                <p className="text-2xl font-bold text-destructive">{resultData.totalQuestions - resultData.correctAnswers}</p>
                <p className="text-xs font-bold text-destructive/70 uppercase tracking-wider mt-1">Incorrect</p>
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <Button variant="outline" className="flex-1" onClick={() => {
                setResultData(null)
                setCurrentView(VIEW_BROWSE)
              }}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── View 5: EXAM REVIEW ─────────────────────────────────────────────────────
  if (currentView === VIEW_REVIEW && reviewData) {
    const { attempt, passed } = reviewData
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Review Header */}
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" onClick={() => setCurrentView(VIEW_BROWSE)} className="px-2">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{attempt.mockExam.title}</h1>
            <div  className="text-muted-foreground flex items-center gap-2">
              <Badge variant="outline">{attempt.mockExam.subject.name}</Badge>
              • {new Date(attempt.submittedAt).toLocaleDateString()}
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl border ${passed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
            <span className="font-bold text-xl">{attempt.score}%</span>
            <span className="text-xs font-bold uppercase ml-2">{passed ? 'PASS' : 'FAIL'}</span>
          </div>
        </div>

        <div className="space-y-6">
          {attempt.answers.map((ans, idx) => {
            const question = ans.question
            return (
              <Card key={ans.id} className={`shadow-sm border-l-4 ${ans.isCorrect ? 'border-l-emerald-500' : 'border-l-destructive'}`}>
                <CardHeader className="pb-2 bg-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Question {idx + 1}</span>
                    {ans.isCorrect 
                      ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Correct</Badge>
                      : <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10 border-none"><XCircle className="w-3 h-3 mr-1" /> Incorrect</Badge>
                    }
                  </div>
                  <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const optionKey = `option${opt}`
                    const isStudentAnswer = ans.selectedAnswer === opt
                    const isCorrectAnswer = ans.correctAnswer === opt

                    let stateClass = "border-border bg-background opacity-60"
                    let icon = null

                    if (isCorrectAnswer) {
                      stateClass = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 opacity-100"
                      icon = <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    } else if (isStudentAnswer && !isCorrectAnswer) {
                      stateClass = "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive opacity-100"
                      icon = <XCircle className="w-5 h-5 text-destructive" />
                    } else if (isStudentAnswer) {
                       // Handled by isCorrectAnswer logic
                    }

                    return (
                      <div key={opt} className={`relative p-3 rounded-xl border-2 flex items-center gap-4 ${stateClass}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2
                          ${isCorrectAnswer ? 'bg-emerald-600 border-emerald-600 text-white' : ''}
                          ${isStudentAnswer && !isCorrectAnswer ? 'bg-destructive border-destructive text-white' : ''}
                          ${!isCorrectAnswer && !isStudentAnswer ? 'border-muted-foreground/30 text-muted-foreground' : ''}
                        `}>
                          {opt}
                        </div>
                        <div className="flex-1 text-sm font-medium">{question[optionKey]}</div>
                        {icon}
                      </div>
                    )
                  })}
                  
                  {/* Explanation Block */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Explanation</p>
                    {question.explanation ? (
                      <div className="text-sm text-foreground bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        {question.explanation}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No explanation provided by the teacher.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-center pt-8 pb-12">
          <Button variant="outline" size="lg" onClick={() => setCurrentView(VIEW_BROWSE)}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
