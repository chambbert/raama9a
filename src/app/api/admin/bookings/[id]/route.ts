import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { ensureVisitForBooking } from '@/lib/booking'
import { z } from 'zod'

const updateBookingSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED']).optional(),
  adminNotes: z.string().optional().nullable(),
  totalPrice: z.number().min(0).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const result = updateBookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // A manually-edited total no longer matches the per-night breakdown it was
    // calculated from, so drop the breakdown rather than show stale numbers.
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(result.data.status && { status: result.data.status }),
        ...(result.data.adminNotes !== undefined && { adminNotes: result.data.adminNotes ?? null }),
        ...(result.data.totalPrice !== undefined && {
          totalPrice: result.data.totalPrice,
          priceBreakdown: null,
        }),
      },
      include: { apartment: true },
    })

    // Confirming a booking creates the guest's CLIENT account and the operational
    // Visit (key codes, cleaning, revenue) in one step.
    if (result.data.status === 'CONFIRMED') {
      await ensureVisitForBooking(updated)
    }

    return NextResponse.json({
      booking: {
        ...updated,
        priceBreakdown: updated.priceBreakdown ? JSON.parse(updated.priceBreakdown) : null,
        visitors: updated.visitors ? JSON.parse(updated.visitors) : null,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update booking error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    await prisma.booking.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete booking error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
