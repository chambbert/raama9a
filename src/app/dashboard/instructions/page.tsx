import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { InstructionAccordionWrapper } from './instruction-accordion-wrapper'

export default async function InstructionsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { highlight } = await searchParams

  const [instructions, tutorialSteps] = await Promise.all([
    prisma.instruction.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    }),
    prisma.instruction.findMany({
      where: { isTutorial: true },
      orderBy: { tutorialOrder: 'asc' },
      select: { id: true, title: true, content: true, imageUrl: true, imageUrls: true, tutorialOrder: true },
    }),
  ])

  const parsedTutorialSteps = tutorialSteps.map((s) => ({
    ...s,
    imageUrls: s.imageUrls ? (JSON.parse(s.imageUrls) as string[]) : null,
  }))

  const grouped = instructions.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = []
    acc[i.category].push({
      id: i.id,
      title: i.title,
      content: i.content,
      category: i.category,
      imageUrl: i.imageUrl,
      isTutorial: i.isTutorial,
    })
    return acc
  }, {} as Record<string, { id: string; title: string; content: string; category: string; imageUrl: string | null; isTutorial: boolean }[]>)

  const categories = Object.keys(grouped)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-sky-600 mb-1">Apartment guide</p>
        <h1 className="font-serif-display text-3xl font-light text-stone-800 tracking-wide">Instructions</h1>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white border border-stone-100 p-12 text-center">
          <p className="text-xs tracking-widest uppercase text-stone-400">No instructions yet</p>
        </div>
      ) : (
        <InstructionAccordionWrapper
          categories={categories}
          grouped={grouped}
          highlight={highlight}
          tutorialSteps={parsedTutorialSteps}
        />
      )}
    </div>
  )
}
