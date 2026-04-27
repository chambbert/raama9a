import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const incident = await prisma.incidentReport.findUnique({ where: { id } })
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const resolved = !incident.resolved
    const updated = await prisma.incidentReport.update({
      where: { id },
      data: { resolved, resolvedAt: resolved ? new Date() : null },
    })

    return NextResponse.json({ incident: updated })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Resolve incident error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
