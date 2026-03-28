import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { cleaningTaskSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const apartmentId = searchParams.get('apartmentId')

    const tasks = await prisma.cleaningTask.findMany({
      where: apartmentId ? { apartmentId } : undefined,
      include: {
        apartment: { select: { id: true, name: true } },
      },
      orderBy: [{ apartmentId: 'asc' }, { order: 'asc' }],
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get cleaning tasks error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validationResult = cleaningTaskSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const task = await prisma.cleaningTask.create({
      data: validationResult.data,
      include: {
        apartment: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create cleaning task error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
