import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

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
