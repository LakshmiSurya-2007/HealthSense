import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar, TopBar } from '@/components/layout/Sidebar'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarW = collapsed ? 64 : 220

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <motion.div
        animate={{ marginLeft: sidebarW }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ marginLeft: sidebarW }}
      >
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </motion.div>
    </div>
  )
}
