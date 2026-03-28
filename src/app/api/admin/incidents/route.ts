import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

function parseMediaUrls(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function GET() {
  try {
    await requireAdmin()

    const incidents = await prisma.incidentReport.findMany({
      include: {
        visit: {
          include: {
            apartment: { select: { id: true, name: true } },
            cleaner: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      incidents: incidents.map((i) => ({ ...i, mediaUrls: parseMediaUrls(i.mediaUrls) })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get admin incidents error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
