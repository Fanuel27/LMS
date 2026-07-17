import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Abebe Girma',
    role: 'Grade 12 Student',
    school: 'Addis Ababa Science School',
    avatar: 'AG',
    avatarBg: 'bg-violet-500',
    rating: 5,
    quote:
      'I used to struggle with Physics, but after practising 200+ questions on this platform my confidence shot up. I got an 88 on my mock exam — the highest in my class!',
  },
  {
    name: 'Tigist Haile',
    role: 'Mathematics Teacher',
    school: 'Dire Dawa Secondary School',
    avatar: 'TH',
    avatarBg: 'bg-emerald-500',
    rating: 5,
    quote:
      'Creating a question bank used to take me days. Now I can upload my notes and build an exam in an hour. My students have access to quality materials 24/7.',
  },
  {
    name: 'Kedir Mohammed',
    role: 'Academic Director',
    school: 'Bahir Dar Preparatory School',
    avatar: 'KM',
    avatarBg: 'bg-blue-500',
    rating: 5,
    quote:
      "Since adopting this platform, our school's average national exam score improved by 11%. The admin dashboard gives us real visibility into which subjects need more attention.",
  },
  {
    name: 'Meron Tadesse',
    role: 'Grade 12 Student',
    school: 'Hawassa Preparatory School',
    avatar: 'MT',
    avatarBg: 'bg-rose-500',
    rating: 5,
    quote:
      'The timed mock exams are so realistic. I stopped panicking during real exams because I had already done 10 full mock exams under pressure. Highly recommend!',
  },
  {
    name: 'Yonas Bekele',
    role: 'Chemistry Teacher',
    school: 'Jimma Secondary School',
    avatar: 'YB',
    avatarBg: 'bg-amber-500',
    rating: 4,
    quote:
      'Uploading my PDF notes and connecting them to the right subject took minutes. My students now download them and come to class better prepared. It changed my teaching.',
  },
  {
    name: 'Selam Worku',
    role: 'School Principal',
    school: 'Mekelle Preparatory School',
    avatar: 'SW',
    avatarBg: 'bg-teal-500',
    rating: 5,
    quote:
      'Managing 600 students and 30 teachers through one clean dashboard is exactly what we needed. Onboarding was fast and the support was excellent.',
  },
]

function StarRating({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-muted'}`}
        />
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Loved by Students, Teachers, and Schools
          </h2>
          <p className="mt-4 text-muted-foreground text-base">
            Hear from the people who use Exam Prep Ethiopia every day.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map(({ name, role, school, avatar, avatarBg, rating, quote }) => (
            <div
              key={name}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              {/* Quote icon */}
              <Quote className="w-6 h-6 text-primary/20" />

              {/* Stars */}
              <StarRating count={rating} />

              {/* Quote text */}
              <p className="text-sm text-foreground leading-relaxed flex-1">"{quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarBg}`}>
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role} · {school}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
