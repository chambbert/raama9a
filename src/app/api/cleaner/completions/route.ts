import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCleaner } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireCleaner()

    const body = await request.json()
    const { taskId, visitId } = body

    if (!taskId || !visitId) {
      return NextResponse.json({ error: 'taskId and visitId are required' }, { status: 400 })
    }

    // Verify cleaner is assigned to this visit
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { cleanerId: true },
    })

    if (!visit || visit.cleanerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const completion = await prisma.taskCompletion.create({
      data: { taskId, visitId },
    })

    return NextResponse.json({ completion }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Handle unique constraint violation (already completed)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Task already completed' }, { status: 409 })
    }
    console.error('Create completion error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireCleaner()

    const body = await request.json()
    const { taskId, visitId } = body

    if (!taskId || !visitId) {
      return NextResponse.json({ error: 'taskId and visitId are required' }, { status: 400 })
    }

    // Verify cleaner is assigned to this visit
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { cleanerId: true },
    })

    if (!visit || visit.cleanerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.taskCompletion.deleteMany({
      where: { taskId, visitId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete completion error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
