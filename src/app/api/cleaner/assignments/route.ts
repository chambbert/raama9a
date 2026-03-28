import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCleaner } from '@/lib/auth'

function parseMediaUrls(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function GET() {
  try {
    const user = await requireCleaner()

    const visits = await prisma.visit.findMany({
      where: { cleanerId: user.id },
      include: {
        apartment: {
          include: {
            cleaningTasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        taskCompletions: true,
        incidentReports: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { checkIn: 'desc' },
    })

    // Parse JSON mediaUrls fields
    const parsed = visits.map((v) => ({
      ...v,
      taskCompletions: v.taskCompletions.map((c) => ({
        ...c,
        mediaUrls: parseMediaUrls(c.mediaUrls),
      })),
      incidentReports: v.incidentReports.map((i) => ({
        ...i,
        mediaUrls: parseMediaUrls(i.mediaUrls),
      })),
    }))

    return NextResponse.json({ visits: parsed })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get cleaner assignments error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
