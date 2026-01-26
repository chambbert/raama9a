import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import {
  MapPin,
  Utensils,
  Camera,
  Mountain,
  ShoppingBag,
  Music,
  Trees,
  Building,
} from 'lucide-react'

const categoryIcons: Record<string, React.ElementType> = {
  restaurants: Utensils,
  attractions: Camera,
  nature: Mountain,
  shopping: ShoppingBag,
  nightlife: Music,
  parks: Trees,
  museums: Building,
}

export default async function SightseeingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const sightseeing = await prisma.sightseeing.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })

  // Group by category
  const grouped = sightseeing.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof sightseeing>)

  const categories = Object.keys(grouped)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sightseeing</h1>
        <p className="text-gray-500">Local recommendations and places to visit</p>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Recommendations Yet
              </h3>
              <p className="text-gray-500">
                Your host will add local recommendations here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const Icon = categoryIcons[category.toLowerCase()] || MapPin
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Icon className="h-5 w-5 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-semibold capitalize">{category}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[category].map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      {item.imageUrl && (
                        <div className="relative h-48">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-3">
                          {item.description}
                        </p>
                        {item.address && (
                          <div className="flex items-start gap-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{item.address}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
