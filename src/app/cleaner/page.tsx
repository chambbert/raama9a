import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, CheckCircle, Circle, Calendar } from 'lucide-react'

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function CleanerPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const visits = await prisma.visit.findMany({
    where: { cleanerId: user.id },
    include: {
      apartment: {
        include: {
          cleaningTasks: { orderBy: { order: 'asc' } },
        },
      },
      taskCompletions: true,
    },
    orderBy: { checkIn: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-500">Apartments assigned for cleaning</p>
      </div>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h3>
              <p className="text-gray-500">You have no cleaning assignments at the moment.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visits.map((visit) => {
            const totalTasks = visit.apartment.cleaningTasks.length
            const completedTasks = visit.taskCompletions.length
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            const isDone = totalTasks > 0 && completedTasks === totalTasks

            return (
              <Link key={visit.id} href={`/cleaner/${visit.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className={`h-2 ${isDone ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{visit.apartment.name}</h3>
                      <p className="text-sm text-gray-500">{visit.apartment.address}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(visit.checkIn)}
                        {visit.checkOut ? ` – ${formatDate(visit.checkOut)}` : ''}
                      </span>
                    </div>

                    {totalTasks > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className={`font-medium ${isDone ? 'text-green-600' : 'text-amber-600'}`}>
                            {completedTasks}/{totalTasks}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isDone ? 'bg-green-500' : 'bg-amber-400'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No tasks defined for this apartment</p>
                    )}

                    <div className="flex items-center gap-1 text-sm">
                      {isDone ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">All done!</span>
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 text-amber-400" />
                          <span className="text-amber-600">In progress</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
