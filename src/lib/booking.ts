import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export function generateGuestPassword(): string {
  // Avoids visually ambiguous characters (0/O, 1/l/I)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

export async function hasBookingConflict(
  apartmentId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const [conflictingBookings, conflictingVisits] = await Promise.all([
    prisma.booking.findMany({
      where: {
        apartmentId,
        status: 'CONFIRMED',
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    }),
    prisma.visit.findMany({
      where: {
        apartmentId,
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    }),
  ])

  return conflictingBookings.length > 0 || conflictingVisits.length > 0
}

type PricedApartment = {
  cleanerFee: number
  pricing: { dayOfWeek: number; pricePerNight: number }[]
  datePrices: { date: string; price: number }[]
}

export function calculateBookingPrice(apartment: PricedApartment, checkIn: Date, checkOut: Date) {
  const pricingMap = new Map(apartment.pricing.map((p) => [p.dayOfWeek, p.pricePerNight]))
  const datePriceMap = new Map(apartment.datePrices.map((dp) => [dp.date, dp.price]))
  const priceBreakdown: { date: string; dayOfWeek: number; price: number }[] = []
  let accommodationTotal = 0

  const current = new Date(checkIn)
  while (current < checkOut) {
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]
    const price = datePriceMap.get(dateStr) ?? pricingMap.get(dayOfWeek) ?? 0
    priceBreakdown.push({ date: dateStr, dayOfWeek, price })
    accommodationTotal += price
    current.setDate(current.getDate() + 1)
  }

  return { priceBreakdown, totalPrice: accommodationTotal + apartment.cleanerFee }
}

// Guests get a CLIENT account as soon as a booking is confirmed, so they can log in
// and see instructions/key codes for their stay.
export async function ensureClientAccount(guestEmail: string, guestName: string, guestPhone?: string | null) {
  const existing = await prisma.user.findUnique({ where: { email: guestEmail } })
  if (existing) return

  const plain = generateGuestPassword()
  const hashed = await hashPassword(plain)
  await prisma.user.create({
    data: {
      email: guestEmail,
      name: guestName,
      phone: guestPhone ?? undefined,
      password: hashed,
      generatedPassword: plain,
      role: 'CLIENT',
    },
  })
}
