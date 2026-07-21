import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { ParnuBackground } from '@/components/dashboard/parnu-background'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      <ParnuBackground />
      <DashboardSidebar />
      {/* top padding on mobile for header, bottom padding for bottom nav */}
      <main className="relative z-10 flex-1 px-5 py-6 pt-20 pb-28 lg:pt-8 lg:pb-12 lg:px-10 max-w-4xl">
        {children}
      </main>
    </div>
  )
}
