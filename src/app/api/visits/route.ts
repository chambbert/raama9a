import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { visitSchema } from '@/lib/validation'

export async function GET() {
  try {
    await requireAdmin()

    const visits = await prisma.visit.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        apartment: true,
        lineItems: true,
      },
      orderBy: { checkIn: 'desc' },
    })

    return NextResponse.json({ visits })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get visits error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { lineItems, ...visitData } = body

    const validationResult = visitSchema.safeParse(visitData)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const visit = await prisma.visit.create({
      data: {
        ...validationResult.data,
        lineItems: lineItems && lineItems.length > 0 ? {
          create: lineItems.map((item: { type: string; description: string; amount: number }) => ({
            type: item.type,
            description: item.description,
            amount: item.amount,
          })),
        } : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        apartment: true,
        lineItems: true,
      },
    })

    return NextResponse.json({ visit }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create visit error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
