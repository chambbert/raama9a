import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()

    const [steps, progress] = await Promise.all([
      prisma.instruction.findMany({
        where: { isTutorial: true },
        orderBy: { tutorialOrder: 'asc' },
        select: { id: true, title: true, content: true, imageUrl: true, imageUrls: true, tutorialOrder: true },
      }),
      prisma.tutorialProgress.findUnique({ where: { userId: user.id } }),
    ])

    return NextResponse.json({ steps, completed: !!progress })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const user = await requireAuth()

    await prisma.tutorialProgress.upsert({
      where: { userId: user.id },
      update: { completedAt: new Date() },
      create: { userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
