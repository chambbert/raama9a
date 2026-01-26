import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { siteSettingsSchema } from '@/lib/validation'

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findFirst()

    if (!settings) {
      // Create default settings
      settings = await prisma.siteSettings.create({
        data: {
          siteName: 'Welcome to Our Apartment',
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validationResult = siteSettingsSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    let settings = await prisma.siteSettings.findFirst()

    if (settings) {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: validationResult.data,
      })
    } else {
      settings = await prisma.siteSettings.create({
        data: validationResult.data,
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
