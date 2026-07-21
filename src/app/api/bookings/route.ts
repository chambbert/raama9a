import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bookingSchema } from '@/lib/validation'
import { hasBookingConflict, calculateBookingPrice } from '@/lib/booking'

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
    if (await hasBookingConflict(apartmentId, checkInDate, checkOutDate)) {
      return NextResponse.json(
        { error: 'These dates are not available. Please choose different dates.' },
        { status: 409 }
      )
    }

    // Calculate price breakdown (date-specific price takes priority over day-of-week)
    const { priceBreakdown, totalPrice } = calculateBookingPrice(apartment, checkInDate, checkOutDate)

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
