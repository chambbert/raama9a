import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { adminBookingSchema } from '@/lib/validation'
import { hasBookingConflict, calculateBookingPrice, ensureClientAccount } from '@/lib/booking'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const bookings = await prisma.booking.findMany({
      where: status ? { status } : undefined,
      include: {
        apartment: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const pendingCount = await prisma.booking.count({ where: { status: 'PENDING' } })

    const bookingsWithParsedBreakdown = bookings.map((b) => ({
      ...b,
      priceBreakdown: b.priceBreakdown ? JSON.parse(b.priceBreakdown) : null,
      visitors: b.visitors ? JSON.parse(b.visitors) : null,
    }))

    return NextResponse.json({ bookings: bookingsWithParsedBreakdown, pendingCount })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get bookings error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// Admin books directly on behalf of a guest (or the owner/family) — created already
// CONFIRMED so it blocks the calendar immediately, with no pending-request step.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const result = adminBookingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { apartmentId, guestName, guestEmail, guestPhone, checkIn, checkOut, adults, notes, visitors } = result.data

    // checkIn/checkOut are plain YYYY-MM-DD strings, which Date already parses
    // as UTC midnight — do not call setHours() here, it re-anchors to local
    // midnight and shifts the stored date by a day on non-UTC servers.
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'Check-out must be after check-in' },
        { status: 400 }
      )
    }

    const apartment = await prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: { pricing: true, datePrices: true },
    })

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    if (await hasBookingConflict(apartmentId, checkInDate, checkOutDate)) {
      return NextResponse.json(
        { error: 'These dates are not available. Please choose different dates.' },
        { status: 409 }
      )
    }

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
        status: 'CONFIRMED',
        totalPrice,
        cleanerFee: apartment.cleanerFee,
        priceBreakdown: JSON.stringify(priceBreakdown),
        visitors: JSON.stringify(visitors),
      },
      include: { apartment: true },
    })

    await ensureClientAccount(guestEmail, guestName, guestPhone)

    return NextResponse.json({
      booking: {
        ...booking,
        priceBreakdown: JSON.parse(booking.priceBreakdown!),
        visitors: JSON.parse(booking.visitors!),
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create admin booking error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
