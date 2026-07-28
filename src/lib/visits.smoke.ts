// Smoke test for who can see a stay (and therefore its key codes).
// Run with: npm run test:visits
//
// findActiveVisit is the single gate in front of the door codes (src/app/dashboard/key-codes/page.tsx
// renders whatever it returns), so both halves of its condition matter: membership decides *who*
// gets in, and the date range decides *when*. A visit is created for each case against the real
// schema — nothing is mocked — and every row is removed again at the end.
import assert from 'node:assert/strict'
import { prisma } from './prisma'
import { findActiveVisit } from './visits'

const TAG = 'visits-smoke'
const email = (who: string) => `${TAG}-${who}@example.invalid`

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

async function makeUser(who: string) {
  return prisma.user.create({
    data: { email: email(who), password: 'not-a-real-hash', name: `${TAG} ${who}`, role: 'CLIENT' },
  })
}

async function cleanup(apartmentId: string | null) {
  if (apartmentId) await prisma.visit.deleteMany({ where: { apartmentId } })
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG } } })
  if (apartmentId) await prisma.apartment.delete({ where: { id: apartmentId } }).catch(() => {})
}

async function main() {
  let apartmentId: string | null = null
  try {
    // Start from a clean slate in case an earlier interrupted run left rows behind.
    const stale = await prisma.apartment.findFirst({ where: { name: TAG } })
    await cleanup(stale?.id ?? null)

    const apartment = await prisma.apartment.create({ data: { name: TAG, address: 'Rääma 9a' } })
    apartmentId = apartment.id

    const [primary, extra, outsider, pastPrimary, pastExtra] = await Promise.all([
      makeUser('primary'),
      makeUser('extra'),
      makeUser('outsider'),
      makeUser('past-primary'),
      makeUser('past-extra'),
    ])

    const active = await prisma.visit.create({
      data: {
        userId: primary.id,
        apartmentId: apartment.id,
        checkIn: daysFromNow(-1),
        checkOut: daysFromNow(1),
        guests: { connect: [{ id: extra.id }] },
      },
    })

    await prisma.visit.create({
      data: {
        userId: pastPrimary.id,
        apartmentId: apartment.id,
        checkIn: daysFromNow(-10),
        checkOut: daysFromNow(-5),
        guests: { connect: [{ id: pastExtra.id }] },
      },
    })

    // 1. The guest who booked still sees their stay.
    assert.equal((await findActiveVisit(primary.id))?.id, active.id)
    console.log('PASS: primary guest sees the stay')

    // 2. An extra guest the admin attached sees the same stay — the whole point of the feature.
    assert.equal((await findActiveVisit(extra.id))?.id, active.id)
    console.log('PASS: extra guest sees the stay')

    // 3. A client with no connection to the stay sees nothing.
    assert.equal(await findActiveVisit(outsider.id), null)
    console.log('PASS: unrelated client sees nothing')

    // 4 & 5. The date window still applies to BOTH kinds of guest. This is the regression that
    // matters: membership is an OR and the date range is an AND, so getting the nesting wrong
    // would hand out door codes for stays that ended days ago.
    assert.equal(await findActiveVisit(pastPrimary.id), null)
    console.log('PASS: checked-out primary guest no longer sees the stay')
    assert.equal(await findActiveVisit(pastExtra.id), null)
    console.log('PASS: checked-out extra guest no longer sees the stay')

    // 6. Unchecking someone in the admin UI revokes their access.
    await prisma.visit.update({
      where: { id: active.id },
      data: { guests: { set: [] } },
    })
    assert.equal(await findActiveVisit(extra.id), null)
    assert.equal((await findActiveVisit(primary.id))?.id, active.id, 'primary must be unaffected')
    console.log('PASS: detaching an extra guest revokes access, primary unaffected')

    console.log('\nAll visit access smoke tests passed.')
  } finally {
    await cleanup(apartmentId)
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err)
  process.exit(1)
})
