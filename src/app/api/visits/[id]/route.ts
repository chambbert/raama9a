import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { VISIT_INCLUDE } from '@/lib/visits'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const { checkIn, checkOut, revenue, costs, notes, apartmentId, userId, guestIds, cleanerId, lineItems } = body

    // Extra guests are replaced wholesale, so unchecking someone in the admin UI revokes their
    // access. The primary guest is filtered out because they already have access via `userId` and
    // would otherwise be listed twice.
    let guestSet: { id: string }[] | undefined
    if (Array.isArray(guestIds)) {
      const primaryId =
        userId ?? (await prisma.visit.findUnique({ where: { id }, select: { userId: true } }))?.userId
      guestSet = guestIds.filter((guestId: string) => guestId !== primaryId).map((guestId: string) => ({ id: guestId }))
    }

    // First update the visit
    const visit = await prisma.visit.update({
      where: { id },
      data: {
        ...(checkIn !== undefined && { checkIn: new Date(checkIn) }),
        ...(checkOut !== undefined && { checkOut: checkOut ? new Date(checkOut) : null }),
        ...(revenue !== undefined && { revenue }),
        ...(costs !== undefined && { costs }),
        ...(notes !== undefined && { notes }),
        ...(apartmentId !== undefined && { apartmentId }),
        ...(userId !== undefined && { userId }),
        ...(guestSet !== undefined && { guests: { set: guestSet } }),
        ...('cleanerId' in body && { cleanerId: cleanerId || null }),
      },
    })

    // Handle line items: delete existing and create new ones
    if (lineItems !== undefined) {
      // Delete existing line items
      await prisma.visitLineItem.deleteMany({
        where: { visitId: id },
      })

      // Create new line items
      if (lineItems.length > 0) {
        await prisma.visitLineItem.createMany({
          data: lineItems.map((item: { type: string; description: string; amount: number }) => ({
            visitId: id,
            type: item.type,
            description: item.description,
            amount: item.amount,
          })),
        })
      }
    }

    // Fetch the updated visit with relations
    const updatedVisit = await prisma.visit.findUnique({
      where: { id },
      include: VISIT_INCLUDE,
    })

    return NextResponse.json({ visit: updatedVisit })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update visit error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    await prisma.visit.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete visit error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
