import { Mail, Phone } from 'lucide-react'

interface ContactSectionProps {
  email: string | null
  phone: string | null
}

export function ContactSection({ email, phone }: ContactSectionProps) {
  if (!email && !phone) return null

  return (
    <section className="py-24 bg-stone-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest uppercase text-sky-600 mb-3">Get in touch</p>
          <h2 className="font-serif-display text-4xl md:text-5xl font-light text-stone-800 tracking-wide">
            Contact
          </h2>
          <div className="w-8 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        <div className="max-w-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-4 p-6 bg-white border border-stone-100 hover:border-sky-200 transition-colors group"
              >
                <Mail className="h-5 w-5 text-sky-600 flex-shrink-0" />
                <div>
                  <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Email</p>
                  <p className="text-sm text-stone-700">{email}</p>
                </div>
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-4 p-6 bg-white border border-stone-100 hover:border-sky-200 transition-colors group"
              >
                <Phone className="h-5 w-5 text-sky-600 flex-shrink-0" />
                <div>
                  <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Phone</p>
                  <p className="text-sm text-stone-700">{phone}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
