import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { sightseeingSchema } from '@/lib/validation'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const name = formData.get('name') as string
      const description = formData.get('description') as string
      const address = (formData.get('address') as string) || undefined
      const category = formData.get('category') as string
      const order = parseInt(formData.get('order') as string) || 0

      let imageUrl: string | undefined = undefined

      if (file && file.size > 0) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
            { status: 400 }
          )
        }

        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'File size must be less than 5MB' },
            { status: 400 }
          )
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadsDir, { recursive: true })

        const ext = path.extname(file.name)
        const filename = `sightseeing-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
        const filepath = path.join(uploadsDir, filename)

        const bytes = await file.arrayBuffer()
        await writeFile(filepath, Buffer.from(bytes))

        imageUrl = `/uploads/${filename}`
      }

      const validationResult = sightseeingSchema.safeParse({
        name,
        description,
        address,
        category,
        imageUrl,
        order,
      })

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
    } else {
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
    }
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
