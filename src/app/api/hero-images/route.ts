import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { heroImageSchema } from '@/lib/validation'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

      const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
      const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
      const mediaType = videoTypes.includes(file.type) ? 'VIDEO' : imageTypes.includes(file.type) ? 'IMAGE' : null

      if (!mediaType) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, HEIC, MP4, WebM, MOV' },
          { status: 400 }
        )
      }

      // Validate file size (5MB for images, 50MB for video)
      const maxSize = mediaType === 'VIDEO' ? 50 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File size must be less than ${mediaType === 'VIDEO' ? '50MB' : '5MB'}` },
          { status: 400 }
        )
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })

      // Generate unique filename from MIME type (not user-supplied filename)
      const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/heic': '.heic',
        'image/heif': '.heif',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/quicktime': '.mov',
      }
      const ext = mimeToExt[file.type] ?? '.jpg'
      const filename = `hero-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
      const filepath = path.join(uploadsDir, filename)

      // Write file
      const bytes = await file.arrayBuffer()
      await writeFile(filepath, Buffer.from(bytes))

      // Save to database
      const heroImage = await prisma.heroImage.create({
        data: {
          mediaUrl: `/uploads/${filename}`,
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
