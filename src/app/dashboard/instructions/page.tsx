import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Book } from 'lucide-react'
import { InstructionAccordionWrapper } from './instruction-accordion-wrapper'

export default async function InstructionsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { highlight } = await searchParams

  const instructions = await prisma.instruction.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })

  // Group by category
  const grouped = instructions.reduce((acc, instruction) => {
    if (!acc[instruction.category]) {
      acc[instruction.category] = []
    }
    acc[instruction.category].push({
      id: instruction.id,
      title: instruction.title,
      content: instruction.content,
      category: instruction.category,
      imageUrl: instruction.imageUrl,
    })
    return acc
  }, {} as Record<string, { id: string; title: string; content: string; category: string; imageUrl: string | null }[]>)

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
        <InstructionAccordionWrapper
          categories={categories}
          grouped={grouped}
          highlight={highlight}
        />
      )}
    </div>
  )
}
