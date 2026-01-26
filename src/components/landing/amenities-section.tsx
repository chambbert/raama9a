import {
  Wifi,
  Car,
  Tv,
  Wind,
  Coffee,
  Utensils,
  WashingMachine,
  Snowflake,
  Waves,
  Mountain,
} from 'lucide-react'

const defaultAmenities = [
  { icon: Wifi, name: 'Free WiFi' },
  { icon: Car, name: 'Free Parking' },
  { icon: Tv, name: 'Smart TV' },
  { icon: Wind, name: 'Air Conditioning' },
  { icon: Coffee, name: 'Coffee Machine' },
  { icon: Utensils, name: 'Fully Equipped Kitchen' },
  { icon: WashingMachine, name: 'Washer/Dryer' },
  { icon: Snowflake, name: 'Heating' },
]

interface AmenitiesSectionProps {
  amenities?: { icon: string; name: string }[]
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const displayAmenities = amenities || defaultAmenities

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Amenities</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {displayAmenities.map((amenity, index) => {
            const Icon = typeof amenity.icon === 'string'
              ? Wifi
              : amenity.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Icon className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">
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
