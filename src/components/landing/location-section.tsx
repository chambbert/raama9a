import { MapPin, Navigation } from 'lucide-react'

interface LocationSectionProps {
  address: string | null
  mapUrl?: string | null
}

export function LocationSection({ address, mapUrl }: LocationSectionProps) {
  if (!address) return null

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Location</h2>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-8">
            <MapPin className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium mb-1">Address</h3>
              <p className="text-gray-600">{address}</p>
            </div>
          </div>

          {mapUrl ? (
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-lg bg-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Navigation className="h-12 w-12 mx-auto mb-2" />
                <p>Map view not available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
