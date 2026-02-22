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
      const name = formData.get('name') as string | null
      const description = formData.get('description') as string | null
      const address = formData.get('address') as string | null
      const category = formData.get('category') as string | null
      const orderStr = formData.get('order') as string | null
      const removeImage = formData.get('removeImage') as string | null

      const data: Record<string, unknown> = {}
      if (name !== null) data.name = name
      if (description !== null) data.description = description
      if (address !== null) data.address = address || null
      if (category !== null) data.category = category
      if (orderStr !== null) data.order = parseInt(orderStr) || 0

      // Handle image removal
      if (removeImage === 'true') {
        const existing = await prisma.sightseeing.findUnique({ where: { id } })
        if (existing?.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
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

        // Delete old uploaded image if exists
        const existing = await prisma.sightseeing.findUnique({ where: { id } })
        if (existing?.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
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
        const filename = `sightseeing-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
        const filepath = path.join(uploadsDir, filename)

        const bytes = await file.arrayBuffer()
        await writeFile(filepath, Buffer.from(bytes))

        data.imageUrl = `/uploads/${filename}`
      }

      const item = await prisma.sightseeing.update({
        where: { id },
        data,
      })

      return NextResponse.json({ sightseeing: item })
    } else {
      const body = await request.json()
      const { name, description, address, category, imageUrl, order } = body

      const item = await prisma.sightseeing.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(address !== undefined && { address }),
          ...(category !== undefined && { category }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(order !== undefined && { order }),
        },
      })

      return NextResponse.json({ sightseeing: item })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update sightseeing error:', error)
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

    // Delete associated uploaded image file
    const item = await prisma.sightseeing.findUnique({ where: { id } })
    if (item?.imageUrl && item.imageUrl.startsWith('/uploads/')) {
      try {
        const imagePath = path.join(process.cwd(), 'public', item.imageUrl)
        await unlink(imagePath)
      } catch {
        // File may not exist, continue
      }
    }

    await prisma.sightseeing.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete sightseeing error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
