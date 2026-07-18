import { Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

export default function ComingSoonPlaceholder({ title, description }) {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card className="border-dashed border-2 border-border/60 bg-accent/20">
        <CardContent className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm rotate-3 hover:rotate-6 transition-transform">
            <Construction className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-lg mb-8 leading-relaxed">
            {description}
          </p>
          <div className="flex items-center gap-4">
            <Button asChild variant="default" className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/teacher/dashboard">Return to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/teacher/subjects">Browse Subjects</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
