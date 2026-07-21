import { MapPin } from 'lucide-react'

interface LocationSectionProps {
  address: string | null
  mapUrl?: string | null
}

export function LocationSection({ address, mapUrl }: LocationSectionProps) {
  if (!address) return null

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest uppercase text-sky-600 mb-3">Find us</p>
          <h2 className="font-serif-display text-4xl md:text-5xl font-light text-stone-800 tracking-wide">
            Location
          </h2>
          <div className="w-8 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <MapPin className="h-4 w-4 text-sky-600 flex-shrink-0" />
            <p className="text-sm tracking-wide text-stone-500">{address}</p>
          </div>

          {mapUrl ? (
            <div className="aspect-video overflow-hidden border border-stone-100">
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
            <div className="aspect-video bg-stone-50 border border-stone-100 flex items-center justify-center">
              <p className="text-xs tracking-widest uppercase text-stone-400">Map not configured</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
