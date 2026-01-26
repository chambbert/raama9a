import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building, Calendar, DollarSign, Star, Image } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function AdminDashboardPage() {
  // Auth is handled by layout

  const [
    usersCount,
    apartmentsCount,
    visitsCount,
    pendingReviewsCount,
    heroImagesCount,
    revenueData,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.apartment.count(),
    prisma.visit.count(),
    prisma.review.count({ where: { approved: false } }),
    prisma.heroImage.count({ where: { active: true } }),
    prisma.visit.aggregate({
      _sum: { revenue: true, costs: true },
    }),
  ])

  const totalRevenue = revenueData._sum.revenue || 0
  const totalCosts = revenueData._sum.costs || 0
  const netProfit = totalRevenue - totalCosts

  // Get recent visits
  const recentVisits = await prisma.visit.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      apartment: { select: { name: true } },
    },
  })

  const stats = [
    {
      title: 'Total Clients',
      value: usersCount,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Apartments',
      value: apartmentsCount,
      icon: Building,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Visits',
      value: visitsCount,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Reviews',
      value: pendingReviewsCount,
      icon: Star,
      color: 'bg-yellow-500',
    },
    {
      title: 'Hero Images',
      value: heroImagesCount,
      icon: Image,
      color: 'bg-pink-500',
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(netProfit),
      icon: DollarSign,
      color: netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of your property management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(totalCosts)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {recentVisits.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No visits yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Guest</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Apartment</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check In</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisits.map((visit) => (
                    <tr key={visit.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <p className="font-medium">{visit.user.name}</p>
                        <p className="text-sm text-gray-500">{visit.user.email}</p>
                      </td>
                      <td className="py-3 px-4">{visit.apartment.name}</td>
                      <td className="py-3 px-4">
                        {new Date(visit.checkIn).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {formatCurrency(visit.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
