import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { reviewSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeUnapproved = searchParams.get('all') === 'true'

    // Only admins can see unapproved reviews
    if (includeUnapproved) {
      await requireAdmin()
    }

    const reviews = await prisma.review.findMany({
      where: includeUnapproved ? {} : { approved: true },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()

    const validationResult = reviewSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, rating, comment } = validationResult.data

    const review = await prisma.review.create({
      data: {
        name,
        rating,
        comment,
        userId: user?.id || null,
        approved: false, // Reviews need admin approval
      },
    })

    return NextResponse.json(
      { review, message: 'Review submitted for approval' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
