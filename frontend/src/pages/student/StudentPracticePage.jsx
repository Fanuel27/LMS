import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Target, Activity, Flame, Trophy, PlayCircle, 
  CheckCircle2, XCircle, ArrowRight, Clock, BookOpen, ChevronLeft, ChevronRight
} from 'lucide-react'

import { studentService } from '@/services/student.service'
import { useToast } from '@/hooks/useToast'
import PageHeader from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton'
import EmptyState from '@/components/admin/EmptyState'

export default function StudentPracticePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ─── Dashboard State ──────────────────────────────────────────────────────────
  const [isPracticing, setIsPracticing] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [practiceMode, setPracticeMode] = useState('true') // 'true' = random, 'false' = sequential
  const [questionLimit, setQuestionLimit] = useState(10)
  
  // History Pagination
  const [historyPage, setHistoryPage] = useState(1)

  // ─── Session State ────────────────────────────────────────────────────────────
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [sessionQuestions, setSessionQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [feedback, setFeedback] = useState(null)
  
  // Session progress tracking
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionIncorrect, setSessionIncorrect] = useState(0)
  const [isSessionFinished, setIsSessionFinished] = useState(false)

  // ─── Queries ──────────────────────────────────────────────────────────────────
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['student-practice-progress'],
    queryFn: async () => {
      const res = await studentService.getPracticeProgress()
      return res.data.data
    },
    enabled: !isPracticing
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['student-subjects-list'],
    queryFn: async () => {
      const res = await studentService.getSubjects()
      return res.data.data
    },
    enabled: !isPracticing
  })

  const { data: historyRes, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['student-practice-history', historyPage],
    queryFn: async () => {
      const res = await studentService.getPracticeSessions({ page: historyPage, limit: 5 })
      return res.data.data
    },
    enabled: !isPracticing,
    keepPreviousData: true,
  })

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const submitAnswerMutation = useMutation({
    mutationFn: (data) => studentService.submitPracticeAnswer(data),
    onSuccess: (res) => {
      setFeedback(res.data.data)
      if (res.data.data.correct) {
        setSessionCorrect(prev => prev + 1)
      } else {
        setSessionIncorrect(prev => prev + 1)
      }
      setHasSubmitted(true)
    },
    onError: (err) => {
      toast({ description: err?.response?.data?.message || 'Failed to submit answer', variant: 'destructive' })
    }
  })

  const finishSessionMutation = useMutation({
    mutationFn: (sessionId) => studentService.finishPracticeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['student-practice-progress'])
      queryClient.invalidateQueries(['student-practice-history'])
      queryClient.invalidateQueries(['student-stats'])
    }
  })

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleStartPractice = async () => {
    if (!selectedSubject) {
      toast({ description: 'Please select a subject first.', variant: 'destructive' })
      return
    }

    try {
      const res = await studentService.startPracticeSession({
        subjectId: selectedSubject,
        limit: questionLimit,
        random: practiceMode
      })
      
      const { session, questions } = res.data.data
      if (questions.length === 0) {
        toast({ description: 'No questions available for this subject.', variant: 'destructive' })
        return
      }

      setCurrentSessionId(session.id)
      setSessionQuestions(questions)
      setCurrentIndex(0)
      setSelectedAnswer('')
      setHasSubmitted(false)
      setFeedback(null)
      setSessionCorrect(0)
      setSessionIncorrect(0)
      setIsSessionFinished(false)
      setIsPracticing(true)
    } catch (err) {
      toast({ description: 'Failed to start practice session.', variant: 'destructive' })
    }
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentSessionId) return
    const currentQuestion = sessionQuestions[currentIndex]
    
    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      subjectId: selectedSubject,
      selectedAnswer,
      practiceSessionId: currentSessionId
    })
  }

  const handleNextQuestion = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer('')
      setHasSubmitted(false)
      setFeedback(null)
    } else {
      finishSessionMutation.mutate(currentSessionId)
      setIsSessionFinished(true)
    }
  }

  const handleEndSessionEarly = () => {
    if (currentSessionId) {
      finishSessionMutation.mutate(currentSessionId)
    }
    setIsPracticing(false)
    setIsSessionFinished(false)
    setSessionQuestions([])
    setCurrentSessionId(null)
  }

  const handleFinishSession = () => {
    setIsPracticing(false)
    setIsSessionFinished(false)
    setSessionQuestions([])
    setCurrentSessionId(null)
  }

  // ─── Helper: Format Duration ──────────────────────────────────────────────────
  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return 'Incomplete'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // ─── Render: Loading / Error ──────────────────────────────────────────────────
  if (isLoadingProgress) {
    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader title="Practice Mode" description="Loading your progress..." />
        <CardGridSkeleton count={4} />
      </div>
    )
  }

  // ─── Render: Dashboard View ───────────────────────────────────────────────────
  if (!isPracticing) {
    const stats = progressData || { totalAttempts: 0, overallAccuracy: 0, currentStreak: 0, bestStreak: 0 }
    const sessions = historyRes?.sessions || []
    const pagination = historyRes?.pagination || { totalPages: 1 }

    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader 
          title="Practice Mode" 
          description="Sharpen your skills with immediate feedback and detailed session tracking."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalAttempts}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Accuracy</p>
                <p className="text-2xl font-bold text-foreground">{stats.overallAccuracy}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold text-foreground">{stats.bestStreak}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border bg-muted/20">
              <CardTitle>Start New Practice Session</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label>Select Subject</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="" disabled>-- Select a subject --</option>
                  {subjectsData?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Practice Mode</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={practiceMode}
                    onChange={(e) => setPracticeMode(e.target.value)}
                  >
                    <option value="true">Random Questions</option>
                    <option value="false">Sequential Order</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label>Number of Questions</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={questionLimit}
                    onChange={(e) => setQuestionLimit(Number(e.target.value))}
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={50}>50 Questions</option>
                  </select>
                </div>
              </div>

              <Button 
                onClick={handleStartPractice} 
                className="w-full h-12 text-base font-semibold"
                disabled={!selectedSubject}
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Start Practicing
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border bg-muted/20">
              <CardTitle>Subject Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[300px]">
              {stats.accuracyBySubject?.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Complete practice questions to see your accuracy by subject here.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.accuracyBySubject?.map((s, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{s.subject}</span>
                      <Badge variant="outline" className={Number(s.accuracy) >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                        {s.accuracy}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Practice Session History Table */}
        <Card>
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-600" />
              Practice Session History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingHistory ? (
              <div className="p-6"><CardGridSkeleton count={1} /></div>
            ) : sessions.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Activity}
                  title="No sessions recorded yet"
                  description="Start a practice session above to begin building your history."
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Subject</th>
                        <th className="px-6 py-4 font-medium">Mode</th>
                        <th className="px-6 py-4 font-medium text-center">Questions</th>
                        <th className="px-6 py-4 font-medium text-center">Correct</th>
                        <th className="px-6 py-4 font-medium text-center">Incorrect</th>
                        <th className="px-6 py-4 font-medium text-center">Accuracy</th>
                        <th className="px-6 py-4 font-medium text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                              {session.subject.name}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{session.mode}</td>
                          <td className="px-6 py-4 text-center font-medium">{session.totalQuestions}</td>
                          <td className="px-6 py-4 text-center text-emerald-600 font-medium">{session.correctAnswers}</td>
                          <td className="px-6 py-4 text-center text-destructive font-medium">{session.incorrectAnswers}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={session.accuracy >= 70 ? 'default' : 'secondary'} className={session.accuracy >= 70 ? 'bg-emerald-500' : ''}>
                              {session.accuracy}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.duration)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Page {historyPage} of {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={historyPage === pagination.totalPages}
                      >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render: Session Finished View ────────────────────────────────────────────
  if (isSessionFinished) {
    const accuracy = sessionQuestions.length > 0 ? ((sessionCorrect / sessionQuestions.length) * 100).toFixed(0) : 0
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="text-center shadow-lg border-emerald-100">
          <CardContent className="p-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Practice Complete!</h2>
            <p className="text-muted-foreground mb-8">You have finished this practice session.</p>
            
            <div className="grid grid-cols-3 gap-4 w-full mb-8">
              <div className="bg-muted/30 p-4 rounded-xl">
                <p className="text-2xl font-bold text-foreground">{sessionQuestions.length}</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{sessionCorrect}</p>
                <p className="text-xs font-medium text-emerald-600/70 uppercase tracking-wider">Correct</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
                <p className="text-xs font-medium text-blue-600/70 uppercase tracking-wider">Accuracy</p>
              </div>
            </div>

            <Button onClick={handleFinishSession} className="w-full" size="lg">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render: Active Question View ─────────────────────────────────────────────
  const currentQuestion = sessionQuestions[currentIndex]
  const progressPercent = ((currentIndex) / sessionQuestions.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
            {currentQuestion.subject.name}
          </Badge>
          <span className="text-sm font-medium text-muted-foreground">
            Question {currentIndex + 1} of {sessionQuestions.length}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleEndSessionEarly} className="text-muted-foreground hover:text-destructive">
          <XCircle className="w-4 h-4 mr-2" /> End Session
        </Button>
      </div>

      <div className="w-full bg-muted rounded-full h-2 mb-6 overflow-hidden">
        <div className="bg-violet-600 h-2 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <Card className="shadow-md">
        <CardContent className="p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-8 leading-relaxed whitespace-pre-wrap">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((opt) => {
              const optionKey = `option${opt}`
              const optionText = currentQuestion[optionKey]
              
              let stateClass = "border-border hover:border-violet-300 hover:bg-violet-50 text-foreground cursor-pointer"
              let icon = null
              
              if (selectedAnswer === opt && !hasSubmitted) {
                stateClass = "border-violet-600 bg-violet-50 text-violet-700 ring-1 ring-violet-600"
              }

              if (hasSubmitted) {
                stateClass = "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-60"
                if (feedback?.correctAnswer === opt) {
                  stateClass = "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600 opacity-100"
                  icon = <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                } else if (selectedAnswer === opt && !feedback?.correct) {
                  stateClass = "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive opacity-100"
                  icon = <XCircle className="w-5 h-5 text-destructive" />
                }
              }

              return (
                <div 
                  key={opt}
                  onClick={() => !hasSubmitted && setSelectedAnswer(opt)}
                  className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${stateClass}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2
                    ${hasSubmitted && feedback?.correctAnswer === opt ? 'bg-emerald-600 border-emerald-600 text-white' : ''}
                    ${hasSubmitted && selectedAnswer === opt && !feedback?.correct ? 'bg-destructive border-destructive text-white' : ''}
                    ${!hasSubmitted && selectedAnswer === opt ? 'bg-violet-600 border-violet-600 text-white' : ''}
                    ${!hasSubmitted && selectedAnswer !== opt ? 'border-muted-foreground/30 text-muted-foreground group-hover:border-violet-300' : ''}
                    ${hasSubmitted && feedback?.correctAnswer !== opt && selectedAnswer !== opt ? 'border-muted-foreground/20' : ''}
                  `}>
                    {opt}
                  </div>
                  <div className="flex-1 font-medium text-[15px]">
                    {optionText}
                  </div>
                  {icon}
                </div>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
            <div className="flex-1">
              {hasSubmitted && feedback && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${feedback.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-destructive/10 text-destructive'}`}>
                  {feedback.correct ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold mb-1">{feedback.correct ? 'Correct!' : 'Incorrect'}</p>
                    {feedback.explanation ? (
                      <p className="text-sm opacity-90 leading-relaxed">{feedback.explanation}</p>
                    ) : (
                      <p className="text-sm opacity-90">No detailed explanation provided for this question.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="ml-4 shrink-0">
              {!hasSubmitted ? (
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!selectedAnswer || submitAnswerMutation.isPending}
                  size="lg"
                  className="bg-violet-600 hover:bg-violet-700 text-white min-w-[140px]"
                >
                  {submitAnswerMutation.isPending ? 'Checking...' : 'Submit Answer'}
                </Button>
              ) : (
                <Button 
                  onClick={handleNextQuestion}
                  size="lg"
                  className="min-w-[140px]"
                  disabled={finishSessionMutation.isPending}
                >
                  {currentIndex < sessionQuestions.length - 1 ? (
                    <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
                  ) : (
                    <>Finish Session <Trophy className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
