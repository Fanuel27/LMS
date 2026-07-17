import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'How do students practice questions on the platform?',
    a: 'Students log in to their dedicated portal, choose a subject, and browse or take practice questions. Each question has multiple-choice options, and students receive instant feedback showing the correct answer and an explanation after they respond.',
  },
  {
    q: 'Can teachers upload study notes for students?',
    a: 'Yes. Teachers log in to the Teacher Portal, navigate to Study Notes, and upload PDF files organized by subject. Once uploaded, all enrolled students can view and download the notes directly from their student dashboard.',
  },
  {
    q: 'How are mock exams created?',
    a: 'Teachers create mock exams by selecting questions from the question bank, setting a time limit, and scheduling a start time. Admins can also manage exam availability across subjects. Students see available mock exams on their dashboard and can start them when ready.',
  },
  {
    q: 'Which subjects are covered?',
    a: 'The platform currently covers the core Ethiopian Grade 12 subjects: Mathematics, Physics, Chemistry, Biology, English, Geography, History, Economics, Civics, and Amharic. More subjects can be added by the admin.',
  },
  {
    q: 'How does a school get access to the platform?',
    a: 'Schools contact us through the form on this page. We set up an admin account for the school, and the admin can then register teachers and students. The whole setup process typically takes less than one business day.',
  },
  {
    q: 'Is the platform available on mobile devices?',
    a: 'Yes. The platform is fully responsive and works on smartphones, tablets, and desktop computers. Students can practice questions on their phone without needing to install any app.',
  },
  {
    q: 'How does performance tracking work?',
    a: 'After every practice session and mock exam, results are automatically recorded. Students see their scores by subject and over time. Teachers can view performance for each student. Admins see school-wide stats on their dashboard.',
  },
  {
    q: 'Is there a cost to use the platform?',
    a: 'Contact us for school pricing. We offer flexible plans depending on the number of teachers and students. Individual student access is provided through the school.',
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-accent/50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground leading-snug">{q}</span>
        <ChevronDown
          className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground text-base">
            Can't find the answer you need? Use the contact form below.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((item) => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
