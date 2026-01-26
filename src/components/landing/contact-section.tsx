import { Mail, Phone, MessageCircle } from 'lucide-react'

interface ContactSectionProps {
  email: string | null
  phone: string | null
}

export function ContactSection({ email, phone }: ContactSectionProps) {
  if (!email && !phone) return null

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Contact Us</h2>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-4 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="p-3 rounded-full bg-red-100">
                  <Mail className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p className="text-gray-600">{email}</p>
                </div>
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-4 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="p-3 rounded-full bg-red-100">
                  <Phone className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Phone</h3>
                  <p className="text-gray-600">{phone}</p>
                </div>
              </a>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Have questions? We&apos;re here to help you have the best stay possible.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
