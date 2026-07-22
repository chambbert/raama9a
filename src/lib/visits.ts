import { prisma } from './prisma'

// The visit whose key codes a logged-in guest should see. Guests get their login
// as soon as a booking is confirmed (before arrival), so future stays count too;
// checkOut is stored as midnight, so compare against the start of today to keep
// codes visible through check-out day (including same-day "0 night" visits).
export function findActiveVisit(userId: string) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  return prisma.visit.findFirst({
    where: {
      userId,
      OR: [{ checkOut: null }, { checkOut: { gte: startOfToday } }],
    },
    orderBy: { checkIn: 'asc' },
    include: { apartment: true },
  })
}
