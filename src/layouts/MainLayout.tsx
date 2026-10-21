import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export function MainLayout({ noFooter }: { noFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      {!noFooter && <Footer />}
    </div>
  )
}
