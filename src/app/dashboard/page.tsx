import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Key, Book, MapPin, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { SearchBar } from '@/components/dashboard/search-bar'
import { AnimatedCard } from '@/components/dashboard/animated-card'
import { TutorialLauncher } from '@/components/dashboard/tutorial-launcher'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const now = new Date()
  const activeVisit = await prisma.visit.findFirst({
    where: {
      userId: user.id,
      checkIn: { lte: now },
      OR: [{ checkOut: null }, { checkOut: { gte: now } }],
    },
    include: { apartment: true },
  })

  const [keyCodesCount, instructionsCount, sightseeingCount, tutorialSteps, tutorialProgress] =
    await Promise.all([
      activeVisit
        ? prisma.keyCode.count({ where: { apartmentId: activeVisit.apartmentId } })
        : 0,
      prisma.instruction.count(),
      prisma.sightseeing.count(),
      prisma.instruction.findMany({
        where: { isTutorial: true },
        orderBy: { tutorialOrder: 'asc' },
        select: { id: true, title: true, content: true, imageUrl: true, imageUrls: true, tutorialOrder: true },
      }),
      prisma.tutorialProgress.findUnique({ where: { userId: user.id } }),
    ])

  const parsedTutorialSteps = tutorialSteps.map((s) => ({
    ...s,
    imageUrls: s.imageUrls ? (JSON.parse(s.imageUrls) as string[]) : null,
  }))

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const cards = [
    {
      title: 'Key Codes',
      value: keyCodesCount,
      description: 'Door codes & access pins',
      icon: Key,
      href: '/dashboard/key-codes',
    },
    {
      title: 'Instructions',
      value: instructionsCount,
      description: 'How-to guides for appliances',
      icon: Book,
      href: '/dashboard/instructions',
    },
    {
      title: 'Sightseeing',
      value: sightseeingCount,
      description: 'Local spots & hidden gems',
      icon: MapPin,
      href: '/dashboard/sightseeing',
    },
    {
      title: 'Review',
      value: null,
      description: 'Share your experience',
      icon: Star,
      href: '/dashboard/review',
    },
  ]

  return (
    <div className="space-y-8">
      <TutorialLauncher
        steps={parsedTutorialSteps}
        autoShow={!tutorialProgress && parsedTutorialSteps.length > 0}
      />
      {/* Greeting */}
      <div>
        <p className="text-xs tracking-widest uppercase text-sky-600 mb-1">{greeting}</p>
        <h1 className="font-serif-display text-3xl font-light text-stone-800 tracking-wide">
          {user.name}
        </h1>
      </div>

      <SearchBar />

      {/* Active stay */}
      {activeVisit ? (
        <AnimatedCard index={0}>
          <div className="bg-stone-900 text-white p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-stone-800 flex-shrink-0">
                <Calendar className="h-5 w-5 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Current stay</p>
                <p className="font-serif-display text-xl font-light tracking-wide text-white">
                  {activeVisit.apartment.name}
                </p>
                <p className="text-sm text-stone-400 mt-0.5 truncate">{activeVisit.apartment.address}</p>
                <div className="flex gap-8 mt-4">
                  <div>
                    <p className="text-xs tracking-widest uppercase text-stone-500">Check-in</p>
                    <p className="text-sm text-stone-200 mt-0.5">{formatDate(activeVisit.checkIn)}</p>
                  </div>
                  {activeVisit.checkOut && (
                    <div>
                      <p className="text-xs tracking-widest uppercase text-stone-500">Check-out</p>
                      <p className="text-sm text-stone-200 mt-0.5">{formatDate(activeVisit.checkOut)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>
      ) : (
        <div className="border border-stone-200 bg-white/80 backdrop-blur-sm p-6 text-center">
          <p className="text-sm text-stone-400">
            No active stay. Key codes will appear here during your visit.
          </p>
        </div>
      )}

      {/* Quick access cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
        {cards.map((card, index) => {
          const Icon = card.icon
          const isAccent = index === 0 // Key Codes gets highlight treatment
          return (
            <AnimatedCard key={card.href} index={index + 1} className="h-full">
              <Link href={card.href} className="flex h-full group">
                <div className={`flex flex-col w-full p-5 border-t-2 transition-colors ${
                  isAccent
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-white/80 backdrop-blur-sm border-stone-200 hover:border-sky-400'
                }`}>
                  <Icon className={`h-5 w-5 mb-4 ${isAccent ? 'text-white/80' : 'text-sky-600'}`} />
                  <p className={`text-xs tracking-widest uppercase font-medium mb-2 ${isAccent ? 'text-white/70' : 'text-stone-500'}`}>
                    {card.title}
                  </p>
                  <p className={`font-serif-display text-3xl font-light mb-1 ${isAccent ? 'text-white' : 'text-stone-800'}`}>
                    {card.value !== null ? card.value : '→'}
                  </p>
                  <p className={`text-xs leading-relaxed mt-auto pt-3 ${isAccent ? 'text-white/60' : 'text-stone-400'}`}>
                    {card.description}
                  </p>
                </div>
              </Link>
            </AnimatedCard>
          )
        })}
      </div>
    </div>
  )
}
