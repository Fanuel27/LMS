import LandingNavbar from '@/components/landing/LandingNavbar'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PreviewSection from '@/components/landing/PreviewSection'
import WhyUsSection from '@/components/landing/WhyUsSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import FAQSection from '@/components/landing/FAQSection'
import ContactSection from '@/components/landing/ContactSection'
import LandingFooter from '@/components/landing/LandingFooter'

/**
 * LandingPage — Phase 2 public website.
 *
 * Sections (in order):
 *   1. Navbar      – fixed, scroll-aware, mobile-responsive
 *   2. Hero        – headline, CTAs, mock dashboard visual
 *   3. Features    – Students / Teachers / Schools feature cards
 *   4. Preview     – Admin / Teacher / Student dashboard previews
 *   5. WhyUs       – 6 benefit cards
 *   6. Testimonials – 6 placeholder testimonials
 *   7. FAQ         – accordion Q&A
 *   8. Contact     – school inquiry form
 *   9. Footer      – links, role logins, legal
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PreviewSection />
        <WhyUsSection />
        <TestimonialsSection />
        <FAQSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  )
}
