import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apartmentId = searchParams.get('apartmentId')

    if (!apartmentId) {
      return NextResponse.json({ error: 'apartmentId is required' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [confirmedBookings, visits] = await Promise.all([
      prisma.booking.findMany({
        where: {
          apartmentId,
          status: 'CONFIRMED',
          checkOut: { gte: today },
        },
        select: { checkIn: true, checkOut: true },
      }),
      prisma.visit.findMany({
        where: {
          apartmentId,
          checkIn: { gte: today },
        },
        select: { checkIn: true, checkOut: true },
      }),
    ])

    const blockedRanges = [
      ...confirmedBookings.map((b) => ({
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
      })),
      ...visits
        .filter((v) => v.checkOut)
        .map((v) => ({
          checkIn: v.checkIn.toISOString(),
          checkOut: v.checkOut!.toISOString(),
        })),
    ]

    return NextResponse.json({ blockedRanges })
  } catch (error) {
    console.error('Availability error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
