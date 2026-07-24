import { useState } from 'react'
import { Mail, School, User, MessageSquare, Send, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { contactService } from '@/services/contact.service'

function FormField({ id, label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const { toasts, toast } = useToast()

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const onSubmit = async (data) => {
    if (sending) return;
    setSending(true)
    try {
      await contactService.submitContact(data)
      setSubmitted(true)
      reset()
    } catch (err) {
      toast({ title: 'Submission Failed', description: err.response?.data?.message || 'Something went wrong.', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contact" className="py-24 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — copy */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Get in Touch</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Bring Exam Prep Ethiopia to Your School
              </h2>
              <p className="mt-4 text-muted-foreground text-base leading-relaxed">
                Ready to improve your students' national exam results? Fill in the form and our
                team will reach out within one business day to discuss how we can set your school up.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: CheckCircle2, text: 'Free school onboarding consultation' },
                { icon: CheckCircle2, text: 'Custom setup for your teacher and student roster' },
                { icon: CheckCircle2, text: 'Ongoing support from our team' },
                { icon: CheckCircle2, text: 'Flexible pricing for schools of all sizes' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-foreground">
                  <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>contact@examprep.et</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <School className="w-4 h-4" />
                <span>Serving schools across all Ethiopian regions</span>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center text-center py-8 gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Message Received!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thank you for reaching out. Our team will contact you within one business day.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-6">School Inquiry Form</h3>
                <form
                  id="school-contact-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                  noValidate
                >
                  {/* Full Name */}
                  <FormField id="contact-fullname" label="Full Name" icon={User} error={errors.fullName}>
                    <Input
                      id="contact-fullname"
                      placeholder="Abebe Girma"
                      disabled={sending}
                      {...register('fullName', { required: 'Full Name is required.' })}
                    />
                  </FormField>

                  {/* Email */}
                  <FormField id="contact-email" label="Email Address" icon={Mail} error={errors.email}>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="director@school.edu.et"
                      disabled={sending}
                      {...register('email', {
                        required: 'Email is required.',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Please enter a valid email.',
                        },
                      })}
                    />
                  </FormField>

                  {/* Subject */}
                  <FormField id="contact-subject" label="Subject" icon={MessageSquare} error={errors.subject}>
                    <Input
                      id="contact-subject"
                      placeholder="How can we help you?"
                      disabled={sending}
                      {...register('subject', { required: 'Subject is required.' })}
                    />
                  </FormField>

                  {/* Message */}
                  <FormField id="contact-message" label="Message" icon={MessageSquare} error={errors.message}>
                    <textarea
                      id="contact-message"
                      rows={4}
                      placeholder="Tell us about your school and how we can help…"
                      disabled={sending}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      {...register('message', { required: 'Message is required.' })}
                    />
                  </FormField>

                  <Button
                    id="contact-submit"
                    type="submit"
                    className="w-full"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Toaster toasts={toasts} />
    </section>
  )
}
