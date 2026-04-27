import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bookingSchema } from '@/lib/validation'

function datesOverlap(
  aStart: Date, aEnd: Date,
  bStart: Date, bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = bookingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { apartmentId, guestName, guestEmail, guestPhone, checkIn, checkOut, adults, notes, visitors } = result.data

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    checkInDate.setHours(0, 0, 0, 0)
    checkOutDate.setHours(0, 0, 0, 0)

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'Check-out must be after check-in' },
        { status: 400 }
      )
    }

    // Check apartment exists and get pricing
    const apartment = await prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: { pricing: true, datePrices: true },
    })

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    // Check availability against confirmed bookings and visits
    const [conflictingBookings, conflictingVisits] = await Promise.all([
      prisma.booking.findMany({
        where: {
          apartmentId,
          status: 'CONFIRMED',
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      }),
      prisma.visit.findMany({
        where: {
          apartmentId,
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      }),
    ])

    if (conflictingBookings.length > 0 || conflictingVisits.length > 0) {
      return NextResponse.json(
        { error: 'These dates are not available. Please choose different dates.' },
        { status: 409 }
      )
    }

    // Calculate price breakdown (date-specific price takes priority over day-of-week)
    const pricingMap = new Map(apartment.pricing.map((p) => [p.dayOfWeek, p.pricePerNight]))
    const datePriceMap = new Map(apartment.datePrices.map((dp) => [dp.date, dp.price]))
    const priceBreakdown: { date: string; dayOfWeek: number; price: number }[] = []
    let accommodationTotal = 0

    const current = new Date(checkInDate)
    while (current < checkOutDate) {
      const dayOfWeek = current.getDay()
      const dateStr = current.toISOString().split('T')[0]
      const price = datePriceMap.get(dateStr) ?? pricingMap.get(dayOfWeek) ?? 0
      priceBreakdown.push({
        date: current.toISOString().split('T')[0],
        dayOfWeek,
        price,
      })
      accommodationTotal += price
      current.setDate(current.getDate() + 1)
    }

    const totalPrice = accommodationTotal + apartment.cleanerFee

    const booking = await prisma.booking.create({
      data: {
        apartmentId,
        guestName,
        guestEmail,
        guestPhone: guestPhone ?? null,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults,
        notes: notes ?? null,
        totalPrice,
        cleanerFee: apartment.cleanerFee,
        priceBreakdown: JSON.stringify(priceBreakdown),
        visitors: JSON.stringify(visitors),
      },
      include: { apartment: true },
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
