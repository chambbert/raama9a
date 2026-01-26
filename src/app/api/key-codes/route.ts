import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin, getCurrentUser } from '@/lib/auth'
import { keyCodeSchema } from '@/lib/validation'

export async function GET() {
  try {
    const user = await requireAuth()

    if (user.role === 'ADMIN') {
      // Admins can see all key codes
      const keyCodes = await prisma.keyCode.findMany({
        include: { apartment: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ keyCodes })
    }

    // Clients can only see key codes for apartments they have active visits for
    const now = new Date()
    const activeVisits = await prisma.visit.findMany({
      where: {
        userId: user.id,
        checkIn: { lte: now },
        OR: [
          { checkOut: null },
          { checkOut: { gte: now } },
        ],
      },
      select: { apartmentId: true },
    })

    const apartmentIds = activeVisits.map(v => v.apartmentId)

    const keyCodes = await prisma.keyCode.findMany({
      where: {
        apartmentId: { in: apartmentIds },
        OR: [
          { validFrom: null, validTo: null },
          {
            AND: [
              { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
              { OR: [{ validTo: null }, { validTo: { gte: now } }] },
            ],
          },
        ],
      },
      include: { apartment: true },
    })

    return NextResponse.json({ keyCodes })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get key codes error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validationResult = keyCodeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const keyCode = await prisma.keyCode.create({
      data: validationResult.data,
      include: { apartment: true },
    })

    return NextResponse.json({ keyCode }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create key code error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
