import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { reviewSchema } from '@/lib/validation'
import { saveImageUpload } from '@/lib/uploads'

function saveUploadedFile(file: File): Promise<string> {
  return saveImageUpload(file, { prefix: 'review', allowHeic: false })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeUnapproved = searchParams.get('all') === 'true'

    // Only admins can see unapproved reviews
    if (includeUnapproved) {
      await requireAdmin()
    }

    const reviews = await prisma.review.findMany({
      where: includeUnapproved ? {} : { approved: true },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const contentType = request.headers.get('content-type') || ''
    let body: { name: string; rating: number; comment: string; imageUrl?: string | null }

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      let imageUrl: string | null = null
      if (file && file.size > 0) {
        try {
          imageUrl = await saveUploadedFile(file)
        } catch (e) {
          return NextResponse.json({ error: (e as Error).message }, { status: 400 })
        }
      }

      body = {
        name: formData.get('name') as string,
        rating: parseInt(formData.get('rating') as string),
        comment: formData.get('comment') as string,
        imageUrl,
      }
    } else {
      body = await request.json()
    }

    const validationResult = reviewSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, rating, comment, imageUrl } = validationResult.data
    const isAdmin = user?.role === 'ADMIN'

    const review = await prisma.review.create({
      data: {
        name,
        rating,
        comment,
        imageUrl: imageUrl || null,
        userId: user?.id || null,
        approved: isAdmin, // Admin-created reviews are auto-approved
      },
    })

    return NextResponse.json(
      { review, message: 'Review submitted for approval' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
