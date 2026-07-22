import {
  Wifi,
  Car,
  Tv,
  Wind,
  Coffee,
  Utensils,
  WashingMachine,
  Snowflake,
} from 'lucide-react'

const defaultAmenities = [
  { icon: Wifi, name: 'Free WiFi' },
  { icon: Car, name: 'Free Parking' },
  { icon: Tv, name: 'Smart TV' },
  { icon: Wind, name: 'Air Conditioning' },
  { icon: Coffee, name: 'Coffee Machine' },
  { icon: Utensils, name: 'Fully Equipped Kitchen' },
  { icon: WashingMachine, name: 'Washer' },
  { icon: Snowflake, name: 'Heating' },
]

interface AmenitiesSectionProps {
  amenities?: { icon: string; name: string }[]
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const displayAmenities = amenities || defaultAmenities

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest uppercase text-sky-600 mb-3">What we offer</p>
          <h2 className="font-serif-display text-4xl md:text-5xl font-light text-stone-800 tracking-wide">
            Amenities
          </h2>
          <div className="w-8 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-100 max-w-4xl mx-auto border border-stone-100">
          {displayAmenities.map((amenity, index) => {
            const Icon = typeof amenity.icon === 'string' ? Wifi : amenity.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-8 bg-white hover:bg-sky-50 transition-colors group"
              >
                <Icon className="h-6 w-6 text-sky-600 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-xs tracking-wider uppercase text-stone-500 leading-relaxed">
                  {amenity.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
