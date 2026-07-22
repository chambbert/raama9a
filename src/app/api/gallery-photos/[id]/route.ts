import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { unlink } from 'fs/promises'
import path from 'path'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const { caption, order, active } = body

    const galleryPhoto = await prisma.galleryPhoto.update({
      where: { id },
      data: {
        ...(caption !== undefined && { caption }),
        ...(order !== undefined && { order }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json({ galleryPhoto })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update gallery photo error:', error)
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

    const galleryPhoto = await prisma.galleryPhoto.findUnique({ where: { id } })

    if (!galleryPhoto) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete file if it's a local upload
    if (galleryPhoto.imageUrl.startsWith('/uploads/')) {
      const filepath = path.join(process.cwd(), 'public', galleryPhoto.imageUrl)
      try {
        await unlink(filepath)
      } catch {
        // File might not exist, continue anyway
      }
    }

    await prisma.galleryPhoto.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete gallery photo error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
