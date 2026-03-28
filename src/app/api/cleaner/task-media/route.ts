import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCleaner } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]

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

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV, WebM' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 })
    }

    // Save file
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
      'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm',
    }
    const ext = mimeToExt[file.type] ?? '.bin'
    const filename = `task-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
    const filepath = path.join(uploadsDir, filename)
    await writeFile(filepath, Buffer.from(await file.arrayBuffer()))

    const newUrl = `/uploads/${filename}`

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
