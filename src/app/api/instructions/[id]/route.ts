import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const category = formData.get('category') as string | null
      const title = formData.get('title') as string | null
      const content = formData.get('content') as string | null
      const orderStr = formData.get('order') as string | null
      const removeImage = formData.get('removeImage') as string | null

      const data: Record<string, unknown> = {}
      if (category !== null) data.category = category
      if (title !== null) data.title = title
      if (content !== null) data.content = content
      if (orderStr !== null) data.order = parseInt(orderStr) || 0

      // Handle image removal
      if (removeImage === 'true') {
        const existing = await prisma.instruction.findUnique({ where: { id } })
        if (existing?.imageUrl) {
          try {
            const oldPath = path.join(process.cwd(), 'public', existing.imageUrl)
            await unlink(oldPath)
          } catch {
            // File may not exist, continue
          }
        }
        data.imageUrl = null
      }

      // Handle new file upload
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

        // Delete old image if exists
        const existing = await prisma.instruction.findUnique({ where: { id } })
        if (existing?.imageUrl) {
          try {
            const oldPath = path.join(process.cwd(), 'public', existing.imageUrl)
            await unlink(oldPath)
          } catch {
            // File may not exist, continue
          }
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadsDir, { recursive: true })

        const ext = path.extname(file.name)
        const filename = `instruction-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
        const filepath = path.join(uploadsDir, filename)

        const bytes = await file.arrayBuffer()
        await writeFile(filepath, Buffer.from(bytes))

        data.imageUrl = `/uploads/${filename}`
      }

      const instruction = await prisma.instruction.update({
        where: { id },
        data,
      })

      return NextResponse.json({ instruction })
    } else {
      const body = await request.json()
      const { category, title, content, order, imageUrl } = body

      const instruction = await prisma.instruction.update({
        where: { id },
        data: {
          ...(category !== undefined && { category }),
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(order !== undefined && { order }),
          ...(imageUrl !== undefined && { imageUrl }),
        },
      })

      return NextResponse.json({ instruction })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update instruction error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    // Delete associated image file
    const instruction = await prisma.instruction.findUnique({ where: { id } })
    if (instruction?.imageUrl) {
      try {
        const imagePath = path.join(process.cwd(), 'public', instruction.imageUrl)
        await unlink(imagePath)
      } catch {
        // File may not exist, continue
      }
    }

    await prisma.instruction.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete instruction error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
