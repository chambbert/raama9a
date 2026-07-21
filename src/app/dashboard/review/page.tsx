import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ReviewForm } from './review-form'

export default async function ReviewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const visits = await prisma.visit.findMany({
    where: { userId: user.id },
    include: { apartment: { select: { name: true } } },
    orderBy: { checkIn: 'desc' },
  })

  const serializedVisits = visits.map((v) => ({
    id: v.id,
    checkIn: v.checkIn.toISOString(),
    checkOut: v.checkOut ? v.checkOut.toISOString() : null,
    apartment: { name: v.apartment.name },
  }))

  return <ReviewForm visits={serializedVisits} />
}
