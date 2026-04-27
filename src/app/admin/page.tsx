import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingCalendarWidget } from '@/components/admin/booking-calendar'
import { PendingBookingsWidget } from '@/components/admin/pending-bookings-widget'
import { formatCurrency } from '@/lib/utils'
import { Clock, CalendarCheck, Home, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const in7Days = new Date(today)
  in7Days.setDate(in7Days.getDate() + 7)

  const in14Days = new Date(today)
  in14Days.setDate(in14Days.getDate() + 14)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  const [
    pendingCount,
    pendingReviewsCount,
    upcomingBookingCount,
    upcomingVisitCount,
    currentBookings,
    currentVisits,
    upcomingArrivalBookings,
    upcomingArrivalVisits,
    thisMonthRevenue,
    lastMonthRevenue,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.review.count({ where: { approved: false } }),
    // Confirmed bookings checking in within 7 days
    prisma.booking.count({
      where: { status: 'CONFIRMED', checkIn: { gte: today, lt: in7Days } },
    }),
    // Visits checking in within 7 days
    prisma.visit.count({
      where: { checkIn: { gte: today, lt: in7Days } },
    }),
    // Currently occupied — confirmed bookings
    prisma.booking.findMany({
      where: { status: 'CONFIRMED', checkIn: { lte: today }, checkOut: { gt: today } },
      select: { guestName: true, apartment: { select: { name: true } } },
    }),
    // Currently occupied — visits (checkOut can be null = ongoing)
    prisma.visit.findMany({
      where: {
        checkIn: { lte: today },
        OR: [{ checkOut: null }, { checkOut: { gt: today } }],
      },
      select: {
        user: { select: { name: true } },
        apartment: { select: { name: true } },
      },
    }),
    // Upcoming arrivals next 14 days — bookings
    prisma.booking.findMany({
      where: { status: 'CONFIRMED', checkIn: { gte: today, lt: in14Days } },
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        checkIn: true,
        checkOut: true,
        apartment: { select: { name: true } },
      },
      orderBy: { checkIn: 'asc' },
    }),
    // Upcoming arrivals next 14 days — visits
    prisma.visit.findMany({
      where: { checkIn: { gte: today, lt: in14Days } },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        user: { select: { name: true, email: true, phone: true } },
        apartment: { select: { name: true } },
      },
      orderBy: { checkIn: 'asc' },
    }),
    // Revenue this month (from visits)
    prisma.visit.aggregate({
      where: { checkIn: { gte: monthStart, lt: monthEnd } },
      _sum: { revenue: true },
    }),
    // Revenue last month
    prisma.visit.aggregate({
      where: { checkIn: { gte: lastMonthStart, lt: monthStart } },
      _sum: { revenue: true },
    }),
  ])

  const upcomingCheckIns = upcomingBookingCount + upcomingVisitCount
  const thisMonthRev = thisMonthRevenue._sum.revenue ?? 0
  const lastMonthRev = lastMonthRevenue._sum.revenue ?? 0
  const revDelta =
    lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : null

  // Currently occupied — who and where
  const occupants = [
    ...currentBookings.map((b) => ({ name: b.guestName, apartment: b.apartment.name })),
    ...currentVisits.map((v) => ({ name: v.user.name, apartment: v.apartment.name })),
  ]

  // Merge and sort upcoming arrivals
  type Arrival = {
    id: string
    name: string
    email: string | null
    phone: string | null
    apartment: string
    checkIn: Date
    checkOut: Date | null
    source: 'booking' | 'visit'
  }

  const arrivals: Arrival[] = [
    ...upcomingArrivalBookings.map((b) => ({
      id: b.id,
      name: b.guestName,
      email: b.guestEmail,
      phone: b.guestPhone,
      apartment: b.apartment.name,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      source: 'booking' as const,
    })),
    ...upcomingArrivalVisits.map((v) => ({
      id: v.id,
      name: v.user.name,
      email: v.user.email,
      phone: v.user.phone ?? null,
      apartment: v.apartment.name,
      checkIn: v.checkIn,
      checkOut: v.checkOut,
      source: 'visit' as const,
    })),
  ].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())

  const todayStr = today.toDateString()
  const tomorrowStr = tomorrow.toDateString()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">
          {today.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending bookings */}
        <Link href="/admin/bookings" className="block">
          <Card
            className={`h-full hover:shadow-md transition-shadow ${
              pendingCount > 0 ? 'border-amber-300 bg-amber-50' : ''
            }`}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Pending
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      pendingCount > 0 ? 'text-amber-600' : 'text-gray-900'
                    }`}
                  >
                    {pendingCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {pendingCount === 0
                      ? 'all clear'
                      : pendingCount === 1
                      ? 'needs review'
                      : 'need review'}
                  </p>
                </div>
                <div
                  className={`p-2.5 rounded-xl ${
                    pendingCount > 0 ? 'bg-amber-100' : 'bg-gray-100'
                  }`}
                >
                  <Clock
                    className={`h-5 w-5 ${
                      pendingCount > 0 ? 'text-amber-600' : 'text-gray-400'
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Check-ins next 7 days */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Arriving soon
                </p>
                <p className="text-3xl font-bold text-gray-900">{upcomingCheckIns}</p>
                <p className="text-xs text-gray-400 mt-1">next 7 days</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50">
                <CalendarCheck className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currently occupied */}
        <Card className={occupants.length > 0 ? 'border-emerald-200' : ''}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0 mr-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Occupied now
                </p>
                <p
                  className={`text-3xl font-bold ${
                    occupants.length > 0 ? 'text-emerald-600' : 'text-gray-300'
                  }`}
                >
                  {occupants.length}
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {occupants.length === 0
                    ? 'vacant'
                    : occupants.length === 1
                    ? occupants[0].name
                    : `${occupants.length} apartments`}
                </p>
              </div>
              <div
                className={`p-2.5 rounded-xl flex-shrink-0 ${
                  occupants.length > 0 ? 'bg-emerald-100' : 'bg-gray-100'
                }`}
              >
                <Home
                  className={`h-5 w-5 ${
                    occupants.length > 0 ? 'text-emerald-600' : 'text-gray-300'
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue this month */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(thisMonthRev)}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    revDelta === null
                      ? 'text-gray-400'
                      : revDelta >= 0
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}
                >
                  {revDelta === null
                    ? 'this month'
                    : revDelta >= 0
                    ? `+${revDelta.toFixed(0)}% vs last month`
                    : `${revDelta.toFixed(0)}% vs last month`}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming arrivals + calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming arrivals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Upcoming arrivals{' '}
              <span className="text-gray-400 font-normal text-sm">· next 14 days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {arrivals.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No arrivals in the next 14 days
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {arrivals.map((a) => {
                  const nights =
                    a.checkOut
                      ? Math.round(
                          (a.checkOut.getTime() - a.checkIn.getTime()) / (1000 * 60 * 60 * 24)
                        )
                      : null
                  const isToday = a.checkIn.toDateString() === todayStr
                  const isTomorrow = a.checkIn.toDateString() === tomorrowStr
                  const dayLabel = isToday
                    ? 'Today'
                    : isTomorrow
                    ? 'Tomorrow'
                    : a.checkIn.toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })

                  return (
                    <div key={a.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {a.name}
                          </p>
                          <span
                            className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              a.source === 'booking'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {a.source === 'booking' ? 'Booking' : 'Visit'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {a.apartment}
                          {nights !== null && (
                            <> · {nights} night{nights !== 1 ? 's' : ''}</>
                          )}
                          {a.phone && <> · {a.phone}</>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p
                          className={`text-sm font-semibold ${
                            isToday
                              ? 'text-red-500'
                              : isTomorrow
                              ? 'text-amber-500'
                              : 'text-gray-600'
                          }`}
                        >
                          {dayLabel}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking calendar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingCalendarWidget />
          </CardContent>
        </Card>
      </div>

      {/* Pending bookings — inline quick-action widget */}
      <PendingBookingsWidget />

      {/* Pending reviews alert */}
      {pendingReviewsCount > 0 && (
        <Link href="/admin/reviews" className="block">
          <Card className="border-yellow-200 bg-yellow-50 hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {pendingReviewsCount} review
                      {pendingReviewsCount !== 1 ? 's' : ''} waiting for approval
                    </p>
                    <p className="text-xs text-yellow-600">Click to review and publish</p>
                  </div>
                </div>
                <span className="text-yellow-600 text-sm font-medium flex-shrink-0">
                  Review →
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  )
}
