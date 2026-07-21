import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Lock } from 'lucide-react'
import { KeyCodeCard } from '@/components/dashboard/key-code-card'

export default async function KeyCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { highlight } = await searchParams

  const now = new Date()
  const activeVisit = await prisma.visit.findFirst({
    where: {
      userId: user.id,
      checkIn: { lte: now },
      OR: [{ checkOut: null }, { checkOut: { gte: now } }],
    },
    select: { apartmentId: true },
  })

  const keyCodes = activeVisit
    ? await prisma.keyCode.findMany({
        where: {
          apartmentId: activeVisit.apartmentId,
          OR: [
            { validFrom: null, validTo: null },
            {
              AND: [
                { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
                { OR: [{ validTo: null }, { validTo: { gte: now } }] },
              ],
            },
          ],
        },
        include: { apartment: true },
        orderBy: { createdAt: 'asc' },
      })
    : []

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-sky-600 mb-1">Access</p>
        <h1 className="font-serif-display text-3xl font-light text-stone-800 tracking-wide">Key Codes</h1>
      </div>

      <div className="flex items-start gap-3 border border-sky-100 bg-sky-50/80 backdrop-blur-sm p-4">
        <Lock className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-sky-700 leading-relaxed">
          These codes are confidential. Please do not share them with others.
        </p>
      </div>

      {keyCodes.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm border border-stone-100 p-12 text-center">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">No codes available</p>
          <p className="text-sm text-stone-400">
            {activeVisit
              ? 'No key codes assigned yet. Contact your host.'
              : 'Key codes will appear here during your stay.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyCodes.map((keyCode, index) => (
            <KeyCodeCard
              key={keyCode.id}
              id={keyCode.id}
              description={keyCode.description}
              code={keyCode.code}
              apartmentName={keyCode.apartment?.name}
              isHighlighted={highlight ? keyCode.description.toLowerCase().includes(highlight.toLowerCase()) : false}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
