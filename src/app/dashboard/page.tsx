import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Book, MapPin, Star, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { SearchBar } from '@/components/dashboard/search-bar'
import { AnimatedCard } from '@/components/dashboard/animated-card'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's active visit
  const now = new Date()
  const activeVisit = await prisma.visit.findFirst({
    where: {
      userId: user.id,
      checkIn: { lte: now },
      OR: [
        { checkOut: null },
        { checkOut: { gte: now } },
      ],
    },
    include: {
      apartment: true,
    },
  })

  // Get counts for dashboard cards
  const [keyCodesCount, instructionsCount, sightseeingCount] = await Promise.all([
    activeVisit
      ? prisma.keyCode.count({ where: { apartmentId: activeVisit.apartmentId } })
      : 0,
    prisma.instruction.count(),
    prisma.sightseeing.count(),
  ])

  // Determine greeting based on server time
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const dashboardCards = [
    {
      title: 'Key Codes',
      value: keyCodesCount,
      description: 'Door codes and access pins for your apartment',
      icon: Key,
      href: '/dashboard/key-codes',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
    },
    {
      title: 'Instructions',
      value: instructionsCount,
      description: 'How-to guides for appliances and amenities',
      icon: Book,
      href: '/dashboard/instructions',
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
    },
    {
      title: 'Sightseeing',
      value: sightseeingCount,
      description: 'Our favourite local spots and hidden gems',
      icon: MapPin,
      href: '/dashboard/sightseeing',
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
    },
    {
      title: 'Review',
      value: null,
      description: 'Tell us about your stay — we\'d love your feedback',
      icon: Star,
      href: '/dashboard/review',
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-red-500 mb-1">{greeting}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-500">Here&apos;s everything you need for your stay</p>
      </div>

      <SearchBar />

      {activeVisit && (
        <AnimatedCard index={0}>
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-white/20 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Current Stay</h3>
                  <p className="text-white/90 font-medium">
                    {activeVisit.apartment.name}
                  </p>
                  <p className="text-sm text-white/70">
                    {activeVisit.apartment.address}
                  </p>
                  <div className="flex gap-6 mt-3">
                    <div>
                      <p className="text-xs text-white/60 uppercase tracking-wide">Check-in</p>
                      <p className="text-sm font-medium text-white/90">{formatDate(activeVisit.checkIn)}</p>
                    </div>
                    {activeVisit.checkOut && (
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wide">Check-out</p>
                        <p className="text-sm font-medium text-white/90">{formatDate(activeVisit.checkOut)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      )}

      {!activeVisit && (
        <Card className="bg-gray-100">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-gray-600">
                No active stay found. Contact your host if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon
          return (
            <AnimatedCard key={card.href} index={index + 1}>
              <Link href={card.href}>
                <Card className="cursor-pointer h-full group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.color} transition-transform duration-200 group-hover:scale-110`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {card.value !== null && (
                      <p className="text-2xl font-bold">{card.value}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span>View</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </AnimatedCard>
          )
        })}
      </div>
    </div>
  )
}
