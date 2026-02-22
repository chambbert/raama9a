import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import { SightseeingFilter } from '@/components/dashboard/sightseeing-filter'

export default async function SightseeingPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { highlight } = await searchParams

  const sightseeing = await prisma.sightseeing.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })

  // Get unique categories in order
  const categories = [...new Set(sightseeing.map((item) => item.category))]

  // Flatten items with serializable data
  const allItems = sightseeing.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    address: item.address,
    imageUrl: item.imageUrl,
  }))

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
        <SightseeingFilter
          categories={categories}
          allItems={allItems}
          highlight={highlight}
        />
      )}
    </div>
  )
}
