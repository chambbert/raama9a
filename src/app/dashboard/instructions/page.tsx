import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  WashingMachine,
  Utensils,
  Sparkles,
  Wifi,
  Tv,
  Thermometer,
  ShowerHead,
  Coffee,
  Book,
} from 'lucide-react'

const categoryIcons: Record<string, React.ElementType> = {
  appliances: WashingMachine,
  kitchen: Utensils,
  cleaning: Sparkles,
  wifi: Wifi,
  entertainment: Tv,
  heating: Thermometer,
  bathroom: ShowerHead,
  coffee: Coffee,
}

export default async function InstructionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const instructions = await prisma.instruction.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })

  // Group by category
  const grouped = instructions.reduce((acc, instruction) => {
    if (!acc[instruction.category]) {
      acc[instruction.category] = []
    }
    acc[instruction.category].push(instruction)
    return acc
  }, {} as Record<string, typeof instructions>)

  const categories = Object.keys(grouped)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instructions</h1>
        <p className="text-gray-500">Guides for using the apartment amenities</p>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Instructions Available
              </h3>
              <p className="text-gray-500">
                Instructions will appear here once your host adds them.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const Icon = categoryIcons[category.toLowerCase()] || Book
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Icon className="h-5 w-5 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold capitalize">{category}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grouped[category].map((instruction) => (
                    <Card key={instruction.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{instruction.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="prose prose-sm max-w-none text-gray-600"
                          dangerouslySetInnerHTML={{ __html: instruction.content }}
                        />
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
