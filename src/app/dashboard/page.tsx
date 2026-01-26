import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Book, MapPin, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

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

  const dashboardCards = [
    {
      title: 'Key Codes',
      value: keyCodesCount,
      description: 'Access codes available',
      icon: Key,
      href: '/dashboard/key-codes',
      color: 'bg-blue-500',
    },
    {
      title: 'Instructions',
      value: instructionsCount,
      description: 'Guides & manuals',
      icon: Book,
      href: '/dashboard/instructions',
      color: 'bg-green-500',
    },
    {
      title: 'Sightseeing',
      value: sightseeingCount,
      description: 'Places to visit',
      icon: MapPin,
      href: '/dashboard/sightseeing',
      color: 'bg-purple-500',
    },
    {
      title: 'Review',
      value: null,
      description: 'Share your experience',
      icon: Star,
      href: '/dashboard/review',
      color: 'bg-yellow-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-500">Here&apos;s everything you need for your stay</p>
      </div>

      {activeVisit && (
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Current Stay</h3>
                <p className="text-white/80">
                  {activeVisit.apartment.name} - {activeVisit.apartment.address}
                </p>
                <p className="text-sm text-white/60">
                  {formatDate(activeVisit.checkIn)}
                  {activeVisit.checkOut && ` - ${formatDate(activeVisit.checkOut)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
        {dashboardCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  {card.value !== null && (
                    <p className="text-2xl font-bold">{card.value}</p>
                  )}
                  <p className="text-xs text-gray-500">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Check the Instructions section for guides on using appliances and amenities
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              View your access codes in the Key Codes section
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Explore local attractions in the Sightseeing section
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              We&apos;d love to hear about your stay - leave us a review!
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
