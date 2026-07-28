import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

// Every admin-facing visit response uses this shape, so a newly added relation only has to be
// listed once instead of in each of the GET / POST / PUT handlers.
export const VISIT_INCLUDE = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  guests: { select: { id: true, name: true, email: true } },
  apartment: true,
  lineItems: true,
  cleaner: { select: { id: true, name: true, email: true } },
} satisfies Prisma.VisitInclude

// The visit whose key codes a logged-in guest should see. Guests get their login
// as soon as a booking is confirmed (before arrival), so future stays count too;
// checkOut is stored as midnight, so compare against the start of today to keep
// codes visible through check-out day (including same-day "0 night" visits).
export function findActiveVisit(userId: string) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  return prisma.visit.findFirst({
    where: {
      // A stay is visible to its primary guest and to every extra guest the admin attached, so
      // everyone sharing the apartment gets the door code — not just whoever booked it.
      OR: [{ userId }, { guests: { some: { id: userId } } }],
      AND: { OR: [{ checkOut: null }, { checkOut: { gte: startOfToday } }] },
    },
    orderBy: { checkIn: 'asc' },
    include: { apartment: true },
  })
}
