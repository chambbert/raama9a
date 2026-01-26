import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Lock, AlertCircle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'

export default async function KeyCodesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

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
          {keyCodes.map((keyCode) => (
            <Card key={keyCode.id} className="overflow-hidden">
              <div className="h-2 bg-red-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Key className="h-5 w-5 text-red-500" />
                  </div>
                  <CardTitle className="text-lg">{keyCode.description}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-mono font-bold tracking-wider text-gray-900">
                    {keyCode.code}
                  </p>
                </div>
                {keyCode.apartment && (
                  <p className="text-sm text-gray-500 mt-3">
                    For: {keyCode.apartment.name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
