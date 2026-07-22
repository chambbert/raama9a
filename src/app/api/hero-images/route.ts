import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { heroImageSchema } from '@/lib/validation'
import { saveMediaUpload, UploadError } from '@/lib/uploads'

export async function GET() {
  try {
    const heroImages = await prisma.heroImage.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ heroImages })
  } catch (error) {
    console.error('Get hero images error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const title = formData.get('title') as string | null
      const order = parseInt(formData.get('order') as string) || 0

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      let mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO'
      try {
        ;({ url: mediaUrl, mediaType } = await saveMediaUpload(file, { prefix: 'hero' }))
      } catch (e) {
        if (e instanceof UploadError) {
          return NextResponse.json({ error: e.message }, { status: 400 })
        }
        throw e
      }

      // Save to database
      const heroImage = await prisma.heroImage.create({
        data: {
          mediaUrl,
          mediaType,
          title: title || null,
          order,
          active: true,
        },
      })

      return NextResponse.json({ heroImage }, { status: 201 })
    } else {
      // Handle JSON request (for URL-based images)
      const body = await request.json()
      const validationResult = heroImageSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: validationResult.error.errors[0].message },
          { status: 400 }
        )
      }

      const heroImage = await prisma.heroImage.create({
        data: validationResult.data,
      })

      return NextResponse.json({ heroImage }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create hero image error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
