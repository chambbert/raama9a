import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { galleryPhotoSchema } from '@/lib/validation'
import { saveImageUpload, UploadError } from '@/lib/uploads'

export async function GET() {
  try {
    const galleryPhotos = await prisma.galleryPhoto.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ galleryPhotos })
  } catch (error) {
    console.error('Get gallery photos error:', error)
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
      const caption = formData.get('caption') as string | null
      const order = parseInt(formData.get('order') as string) || 0

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      let imageUrl: string
      try {
        imageUrl = await saveImageUpload(file, { prefix: 'gallery' })
      } catch (e) {
        if (e instanceof UploadError) {
          return NextResponse.json({ error: e.message }, { status: 400 })
        }
        throw e
      }

      // Save to database
      const galleryPhoto = await prisma.galleryPhoto.create({
        data: {
          imageUrl,
          caption: caption || null,
          order,
          active: true,
        },
      })

      return NextResponse.json({ galleryPhoto }, { status: 201 })
    } else {
      // Handle JSON request (for URL-based images)
      const body = await request.json()
      const validationResult = galleryPhotoSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: validationResult.error.errors[0].message },
          { status: 400 }
        )
      }

      const galleryPhoto = await prisma.galleryPhoto.create({
        data: validationResult.data,
      })

      return NextResponse.json({ galleryPhoto }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create gallery photo error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
