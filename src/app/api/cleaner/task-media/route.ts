import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCleaner } from '@/lib/auth'
import { saveMediaUpload, UploadError } from '@/lib/uploads'

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

function parseMediaUrls(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCleaner()

    const formData = await request.formData()
    const taskId = formData.get('taskId') as string | null
    const visitId = formData.get('visitId') as string | null
    const file = formData.get('file') as File | null

    if (!taskId || !visitId || !file) {
      return NextResponse.json({ error: 'taskId, visitId, and file are required' }, { status: 400 })
    }

    // Verify cleaner owns the visit
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { cleanerId: true },
    })
    if (!visit || visit.cleanerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate + save file
    let newUrl: string
    try {
      ;({ url: newUrl } = await saveMediaUpload(file, {
        prefix: 'task',
        imageMaxBytes: MAX_SIZE,
        videoMaxBytes: MAX_SIZE,
      }))
    } catch (e) {
      if (e instanceof UploadError) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
      throw e
    }

    // Upsert completion and append URL
    const existing = await prisma.taskCompletion.findUnique({
      where: { taskId_visitId: { taskId, visitId } },
    })

    if (existing) {
      const urls = parseMediaUrls(existing.mediaUrls)
      urls.push(newUrl)
      const completion = await prisma.taskCompletion.update({
        where: { taskId_visitId: { taskId, visitId } },
        data: { mediaUrls: JSON.stringify(urls) },
      })
      return NextResponse.json({ completion: { ...completion, mediaUrls: urls } })
    } else {
      // Create completion with media
      const completion = await prisma.taskCompletion.create({
        data: { taskId, visitId, mediaUrls: JSON.stringify([newUrl]) },
      })
      return NextResponse.json({ completion: { ...completion, mediaUrls: [newUrl] } }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 })
    }
    console.error('Task media upload error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireCleaner()

    const { taskId, visitId, url } = await request.json()
    if (!taskId || !visitId || !url) {
      return NextResponse.json({ error: 'taskId, visitId, and url are required' }, { status: 400 })
    }

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { cleanerId: true },
    })
    if (!visit || visit.cleanerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const completion = await prisma.taskCompletion.findUnique({
      where: { taskId_visitId: { taskId, visitId } },
    })
    if (!completion) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 })
    }

    const urls = parseMediaUrls(completion.mediaUrls).filter((u) => u !== url)
    const updated = await prisma.taskCompletion.update({
      where: { taskId_visitId: { taskId, visitId } },
      data: { mediaUrls: JSON.stringify(urls) },
    })

    return NextResponse.json({ completion: { ...updated, mediaUrls: urls } })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 })
    }
    console.error('Delete task media error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
