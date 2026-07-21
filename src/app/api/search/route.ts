import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface SearchResult {
  id: string
  type: 'instruction' | 'sightseeing' | 'keycode'
  title: string
  snippet: string
  category: string
  href: string
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results: SearchResult[] = []

    // Search Instructions (title and content)
    const instructions = await prisma.instruction.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      orderBy: { order: 'asc' },
    })

    for (const instruction of instructions) {
      const matchField = instruction.title.toLowerCase().includes(query.toLowerCase())
        ? instruction.title
        : instruction.content
      results.push({
        id: instruction.id,
        type: 'instruction',
        title: instruction.title,
        snippet: matchField.replace(/<[^>]*>/g, '').slice(0, 80),
        category: instruction.category,
        href: `/dashboard/instructions?highlight=${encodeURIComponent(query)}`,
      })
    }

    // Search Sightseeing (name, description, address)
    const sightseeing = await prisma.sightseeing.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { address: { contains: query } },
        ],
      },
      orderBy: { order: 'asc' },
    })

    for (const item of sightseeing) {
      const matchField = item.name.toLowerCase().includes(query.toLowerCase())
        ? item.name
        : item.description
      results.push({
        id: item.id,
        type: 'sightseeing',
        title: item.name,
        snippet: matchField.slice(0, 80),
        category: item.category,
        href: `/dashboard/sightseeing?highlight=${encodeURIComponent(query)}`,
      })
    }

    // Search Key Codes (description only, NOT the code for security)
    const keyCodes = await prisma.keyCode.findMany({
      where: {
        description: { contains: query },
      },
      include: { apartment: true },
    })

    for (const keyCode of keyCodes) {
      results.push({
        id: keyCode.id,
        type: 'keycode',
        title: keyCode.description,
        snippet: keyCode.apartment
          ? `Access code for ${keyCode.apartment.name}`
          : keyCode.description.slice(0, 80),
        category: 'Access',
        href: `/dashboard/key-codes?highlight=${encodeURIComponent(query)}`,
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Search error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
