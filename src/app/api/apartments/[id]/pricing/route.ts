import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apartmentPricingSchema } from '@/lib/validation'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [pricing, apartment, datePrices] = await Promise.all([
      prisma.apartmentPricing.findMany({
        where: { apartmentId: id },
        orderBy: { dayOfWeek: 'asc' },
      }),
      prisma.apartment.findUnique({
        where: { id },
        select: { cleanerFee: true },
      }),
      prisma.apartmentDatePrice.findMany({
        where: { apartmentId: id },
        orderBy: { date: 'asc' },
      }),
    ])

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    return NextResponse.json({ pricing, cleanerFee: apartment.cleanerFee, datePrices })
  } catch (error) {
    console.error('Get pricing error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const result = apartmentPricingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { pricing, cleanerFee, datePrices } = result.data

    await prisma.$transaction(async (tx) => {
      await tx.apartment.update({ where: { id }, data: { cleanerFee } })

      for (const p of pricing) {
        await tx.apartmentPricing.upsert({
          where: { apartmentId_dayOfWeek: { apartmentId: id, dayOfWeek: p.dayOfWeek } },
          create: { apartmentId: id, dayOfWeek: p.dayOfWeek, pricePerNight: p.pricePerNight },
          update: { pricePerNight: p.pricePerNight },
        })
      }

      await tx.apartmentDatePrice.deleteMany({ where: { apartmentId: id } })

      if (datePrices.length > 0) {
        await tx.apartmentDatePrice.createMany({
          data: datePrices.map((dp) => ({ apartmentId: id, date: dp.date, price: dp.price })),
        })
      }
    })

    const [updatedPricing, updatedDatePrices] = await Promise.all([
      prisma.apartmentPricing.findMany({ where: { apartmentId: id }, orderBy: { dayOfWeek: 'asc' } }),
      prisma.apartmentDatePrice.findMany({ where: { apartmentId: id }, orderBy: { date: 'asc' } }),
    ])

    return NextResponse.json({ pricing: updatedPricing, cleanerFee, datePrices: updatedDatePrices })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update pricing error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
