import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { instructionSchema } from '@/lib/validation'
import { saveImageUpload } from '@/lib/uploads'

function saveUploadedFile(file: File): Promise<string> {
  return saveImageUpload(file, { prefix: 'instruction' })
}

export async function GET() {
  try {
    await requireAuth()

    const instructions = await prisma.instruction.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })

    const grouped = instructions.reduce((acc, instruction) => {
      if (!acc[instruction.category]) acc[instruction.category] = []
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

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const category = formData.get('category') as string
      const title = formData.get('title') as string
      const content = formData.get('content') as string
      const order = parseInt(formData.get('order') as string) || 0
      const isTutorial = formData.get('isTutorial') === 'true'
      const tutorialOrder = parseInt(formData.get('tutorialOrder') as string) || 0
      const tutorialImageFiles = formData.getAll('tutorialImages') as File[]

      let imageUrl: string | null = null
      if (file && file.size > 0) {
        try {
          imageUrl = await saveUploadedFile(file)
        } catch (e) {
          return NextResponse.json({ error: (e as Error).message }, { status: 400 })
        }
      }

      const uploadedTutorialUrls: string[] = []
      for (const f of tutorialImageFiles) {
        if (f && f.size > 0) {
          try {
            uploadedTutorialUrls.push(await saveUploadedFile(f))
          } catch (e) {
            return NextResponse.json({ error: (e as Error).message }, { status: 400 })
          }
        }
      }

      const validationResult = instructionSchema.safeParse({
        category,
        title,
        content,
        imageUrl,
        imageUrls: uploadedTutorialUrls.length > 0 ? JSON.stringify(uploadedTutorialUrls) : null,
        order,
        isTutorial,
        tutorialOrder,
      })

      if (!validationResult.success) {
        return NextResponse.json({ error: validationResult.error.errors[0].message }, { status: 400 })
      }

      const instruction = await prisma.instruction.create({ data: validationResult.data })
      return NextResponse.json({ instruction }, { status: 201 })
    } else {
      const body = await request.json()
      const validationResult = instructionSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json({ error: validationResult.error.errors[0].message }, { status: 400 })
      }

      const instruction = await prisma.instruction.create({ data: validationResult.data })
      return NextResponse.json({ instruction }, { status: 201 })
    }
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
