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

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
          { status: 400 }
        )
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 5MB' },
          { status: 400 }
        )
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })

      // Generate unique filename
      const ext = path.extname(file.name)
      const filename = `hero-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
      const filepath = path.join(uploadsDir, filename)

      // Write file
      const bytes = await file.arrayBuffer()
      await writeFile(filepath, Buffer.from(bytes))

      // Save to database
      const heroImage = await prisma.heroImage.create({
        data: {
          imageUrl: `/uploads/${filename}`,
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
