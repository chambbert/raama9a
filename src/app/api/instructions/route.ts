import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { instructionSchema } from '@/lib/validation'

export async function GET() {
  try {
    await requireAuth()

    const instructions = await prisma.instruction.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })

    // Group by category
    const grouped = instructions.reduce((acc, instruction) => {
      if (!acc[instruction.category]) {
        acc[instruction.category] = []
      }
      acc[instruction.category].push(instruction)
      return acc
    }, {} as Record<string, typeof instructions>)

    return NextResponse.json({ instructions, grouped })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get instructions error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validationResult = instructionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const instruction = await prisma.instruction.create({
      data: validationResult.data,
    })

    return NextResponse.json({ instruction }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create instruction error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
