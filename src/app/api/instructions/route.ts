import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { instructionSchema } from '@/lib/validation'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    await requireAuth()

    const instructions = await prisma.instruction.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })

    // Group by category
    const grouped = instructions.reduce((acc, instruction) => {
      if (!acc[instruction.category]) {
        acc[instruction.category] = []
      }
      acc[instruction.category].push(instruction)
      return acc
    }, {} as Record<string, typeof instructions>)

    return NextResponse.json({ instructions, grouped })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get instructions error:', error)
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
      const category = formData.get('category') as string
      const title = formData.get('title') as string
      const content = formData.get('content') as string
      const order = parseInt(formData.get('order') as string) || 0

      let imageUrl: string | null = null

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
        const filename = `instruction-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
        const filepath = path.join(uploadsDir, filename)

        const bytes = await file.arrayBuffer()
        await writeFile(filepath, Buffer.from(bytes))

        imageUrl = `/uploads/${filename}`
      }

      const validationResult = instructionSchema.safeParse({
        category,
        title,
        content,
        imageUrl,
        order,
      })

      if (!validationResult.success) {
        return NextResponse.json(
          { error: validationResult.error.errors[0].message },
          { status: 400 }
        )
      }

      const instruction = await prisma.instruction.create({
        data: validationResult.data,
      })

      return NextResponse.json({ instruction }, { status: 201 })
    } else {
      const body = await request.json()
      const validationResult = instructionSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: validationResult.error.errors[0].message },
          { status: 400 }
        )
      }

      const instruction = await prisma.instruction.create({
        data: validationResult.data,
      })

      return NextResponse.json({ instruction }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create instruction error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
