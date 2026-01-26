import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apartmentSchema } from '@/lib/validation'

export async function GET() {
  try {
    const apartments = await prisma.apartment.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ apartments })
  } catch (error) {
    console.error('Get apartments error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validationResult = apartmentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const apartment = await prisma.apartment.create({
      data: validationResult.data,
    })

    return NextResponse.json({ apartment }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create apartment error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
