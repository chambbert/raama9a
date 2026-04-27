import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { z } from 'zod'

function generatePassword(): string {
  // Avoids visually ambiguous characters (0/O, 1/l/I)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

const updateBookingSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED']),
  adminNotes: z.string().optional().nullable(),
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

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: result.data.status,
        adminNotes: result.data.adminNotes ?? null,
      },
      include: { apartment: true },
    })

    // Auto-create a CLIENT account when a booking is confirmed
    if (result.data.status === 'CONFIRMED') {
      const existing = await prisma.user.findUnique({ where: { email: booking.guestEmail } })
      if (!existing) {
        const plain = generatePassword()
        const hashed = await hashPassword(plain)
        await prisma.user.create({
          data: {
            email: booking.guestEmail,
            name: booking.guestName,
            phone: booking.guestPhone ?? undefined,
            password: hashed,
            generatedPassword: plain,
            role: 'CLIENT',
          },
        })
      }
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
