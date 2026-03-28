import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { CleanerSidebar } from '@/components/cleaner/sidebar'

export default async function CleanerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?callbackUrl=/cleaner')
  }

  if (user.role !== 'CLEANER') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <CleanerSidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
