import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SightseeingFilter } from '@/components/dashboard/sightseeing-filter'

export default async function SightseeingPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { highlight } = await searchParams

  const sightseeing = await prisma.sightseeing.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })

  const categories = [...new Set(sightseeing.map((item) => item.category))]
  const allItems = sightseeing.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    address: item.address,
    imageUrl: item.imageUrl,
  }))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-sky-600 mb-1">Explore Pärnu</p>
        <h1 className="font-serif-display text-3xl font-light text-stone-800 tracking-wide">Sightseeing</h1>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm border border-stone-100 p-12 text-center">
          <p className="text-xs tracking-widest uppercase text-stone-400">No recommendations yet</p>
        </div>
      ) : (
        <SightseeingFilter categories={categories} allItems={allItems} highlight={highlight} />
      )}
    </div>
  )
}
