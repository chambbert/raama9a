import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, AlertCircle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { KeyCodeCard } from '@/components/dashboard/key-code-card'

export default async function KeyCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { highlight } = await searchParams

  // Get user's active visit
  const now = new Date()
  const activeVisit = await prisma.visit.findFirst({
    where: {
      userId: user.id,
      checkIn: { lte: now },
      OR: [
        { checkOut: null },
        { checkOut: { gte: now } },
      ],
    },
    select: { apartmentId: true },
  })

  // Get key codes for the active visit
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Key Codes</h1>
        <p className="text-gray-500">Access codes for your stay</p>
      </div>

      <Alert variant="info">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span>These codes are confidential. Please do not share them with others.</span>
        </div>
      </Alert>

      {keyCodes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Access Codes Available
              </h3>
              <p className="text-gray-500">
                {activeVisit
                  ? 'No key codes have been assigned to your stay yet. Please contact your host.'
                  : 'You don\'t have an active stay. Key codes will appear here during your visit.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyCodes.map((keyCode, index) => {
            const isMatch = highlight
              ? keyCode.description.toLowerCase().includes(highlight.toLowerCase())
              : false
            return (
              <KeyCodeCard
                key={keyCode.id}
                id={keyCode.id}
                description={keyCode.description}
                code={keyCode.code}
                apartmentName={keyCode.apartment?.name}
                isHighlighted={isMatch}
                index={index}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
