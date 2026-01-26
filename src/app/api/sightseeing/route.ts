import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { sightseeingSchema } from '@/lib/validation'

export async function GET() {
  try {
    await requireAuth()

    const sightseeing = await prisma.sightseeing.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })

    // Group by category
    const grouped = sightseeing.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, typeof sightseeing>)

    return NextResponse.json({ sightseeing, grouped })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get sightseeing error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validationResult = sightseeingSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const item = await prisma.sightseeing.create({
      data: validationResult.data,
    })

    return NextResponse.json({ sightseeing: item }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create sightseeing error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
