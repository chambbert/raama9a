import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCleaner } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]
const MAX_SIZE = 50 * 1024 * 1024

function parseMediaUrls(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireCleaner()

    const { searchParams } = new URL(request.url)
    const visitId = searchParams.get('visitId')

    if (!visitId) {
      return NextResponse.json({ error: 'visitId is required' }, { status: 400 })
    }

    // Verify cleaner owns the visit
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { cleanerId: true },
    })
    if (!visit || visit.cleanerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const incidents = await prisma.incidentReport.findMany({
      where: { visitId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      incidents: incidents.map((i) => ({ ...i, mediaUrls: parseMediaUrls(i.mediaUrls) })),
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 })
    }
    console.error('Get incidents error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCleaner()

    const contentType = request.headers.get('content-type') || ''
    let visitId: string, type: string, description: string
    let mediaUrls: string[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      visitId = formData.get('visitId') as string
      type = formData.get('type') as string
      description = formData.get('description') as string
      const file = formData.get('file') as File | null

      if (file && file.size > 0) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV, WebM' },
            { status: 400 }
          )
        }
        if (file.size > MAX_SIZE) {
          return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 })
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadsDir, { recursive: true })

        const mimeToExt: Record<string, string> = {
          'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
          'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm',
        }
        const ext = mimeToExt[file.type] ?? '.bin'
        const filename = `incident-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
        await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()))
        mediaUrls = [`/uploads/${filename}`]
      }
    } else {
      const body = await request.json()
      visitId = body.visitId
      type = body.type
      description = body.description
    }

    if (!visitId || !type || !description) {
      return NextResponse.json({ error: 'visitId, type, and description are required' }, { status: 400 })
    }

    const validTypes = ['broken', 'stolen', 'other']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'type must be broken, stolen, or other' }, { status: 400 })
    }

    // Verify cleaner owns the visit
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { cleanerId: true },
    })
    if (!visit || visit.cleanerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const incident = await prisma.incidentReport.create({
      data: { visitId, type, description, mediaUrls: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null },
    })

    return NextResponse.json(
      { incident: { ...incident, mediaUrls } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 })
    }
    console.error('Create incident error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
