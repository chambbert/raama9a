import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { unlink } from 'fs/promises'
import path from 'path'
import { saveImageUpload } from '@/lib/uploads'

function saveUploadedFile(file: File): Promise<string> {
  return saveImageUpload(file, { prefix: 'instruction' })
}

async function tryUnlink(url: string) {
  try {
    await unlink(path.join(process.cwd(), 'public', url))
  } catch {
    // File may not exist
  }
}

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
      const isTutorialStr = formData.get('isTutorial') as string | null
      const tutorialOrderStr = formData.get('tutorialOrder') as string | null
      const tutorialImageFiles = formData.getAll('tutorialImages') as File[]
      // JSON array of existing URLs to remove
      const removeTutorialImagesStr = formData.get('removeTutorialImages') as string | null

      const existing = await prisma.instruction.findUnique({ where: { id } })
      const data: Record<string, unknown> = {}

      if (category !== null) data.category = category
      if (title !== null) data.title = title
      if (content !== null) data.content = content
      if (orderStr !== null) data.order = parseInt(orderStr) || 0
      if (isTutorialStr !== null) data.isTutorial = isTutorialStr === 'true'
      if (tutorialOrderStr !== null) data.tutorialOrder = parseInt(tutorialOrderStr) || 0

      // Handle main image removal
      if (removeImage === 'true') {
        if (existing?.imageUrl) await tryUnlink(existing.imageUrl)
        data.imageUrl = null
      }

      // Handle main image upload
      if (file && file.size > 0) {
        if (existing?.imageUrl) await tryUnlink(existing.imageUrl)
        try {
          data.imageUrl = await saveUploadedFile(file)
        } catch (e) {
          return NextResponse.json({ error: (e as Error).message }, { status: 400 })
        }
      }

      // Handle tutorial carousel images
      const existingUrls: string[] = existing?.imageUrls ? JSON.parse(existing.imageUrls) : []
      const urlsToRemove: string[] = removeTutorialImagesStr ? JSON.parse(removeTutorialImagesStr) : []

      // Delete removed files
      for (const url of urlsToRemove) await tryUnlink(url)

      // Upload new files
      const newUrls: string[] = []
      for (const f of tutorialImageFiles) {
        if (f && f.size > 0) {
          try {
            newUrls.push(await saveUploadedFile(f))
          } catch (e) {
            return NextResponse.json({ error: (e as Error).message }, { status: 400 })
          }
        }
      }

      const updatedUrls = [...existingUrls.filter((u) => !urlsToRemove.includes(u)), ...newUrls]
      data.imageUrls = updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : null

      const instruction = await prisma.instruction.update({ where: { id }, data })
      return NextResponse.json({ instruction })
    } else {
      const body = await request.json()
      const { category, title, content, order, imageUrl, isTutorial, tutorialOrder } = body

      const instruction = await prisma.instruction.update({
        where: { id },
        data: {
          ...(category !== undefined && { category }),
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(order !== undefined && { order }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(isTutorial !== undefined && { isTutorial }),
          ...(tutorialOrder !== undefined && { tutorialOrder }),
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

    const instruction = await prisma.instruction.findUnique({ where: { id } })
    if (instruction?.imageUrl) await tryUnlink(instruction.imageUrl)
    if (instruction?.imageUrls) {
      const urls: string[] = JSON.parse(instruction.imageUrls)
      for (const url of urls) await tryUnlink(url)
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
