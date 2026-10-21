import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, LayoutDashboard, Brain, Lightbulb,
  Bot, BarChart3, FileText, User, Settings,
  LogOut, ChevronLeft, ChevronRight, Menu,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/predict',      label: 'Predict',     icon: Brain },
  { to: '/suggestions',  label: 'Suggestions', icon: Lightbulb },
  { to: '/chat',         label: 'AI Chat',     icon: Bot },
  { to: '/analyze',      label: 'Analyze',     icon: BarChart3 },
  { to: '/reports',      label: 'Reports',     icon: FileText },
]

const BOTTOM_ITEMS = [
  { to: '/profile',   label: 'Profile',   icon: User },
  { to: '/settings',  label: 'Settings',  icon: Settings },
]

interface Props {
  collapsed: boolean
  onCollapse: (v: boolean) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: Props) {
  const { user, displayName, initials, signOut } = useAuth()
  const navigate = useNavigate()
  const handleSignOut = async () => { await signOut(); navigate('/') }

  const inner = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo row */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/06 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }} className="overflow-hidden flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none whitespace-nowrap">HealthSense</p>
              <p className="text-secondary text-[10px] mt-0.5 whitespace-nowrap">AI Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Desktop collapse toggle */}
        <button onClick={() => onCollapse(!collapsed)}
          className="hidden lg:flex ml-auto w-7 h-7 rounded-lg bg-white/05 hover:bg-white/10 items-center justify-center text-white/50 hover:text-white transition-colors flex-shrink-0">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
        {/* Mobile close */}
        <button onClick={onMobileClose}
          className="lg:hidden ml-auto w-7 h-7 rounded-lg bg-white/05 text-white/50 hover:text-white flex items-center justify-center transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {!collapsed && <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5">Menu</p>}
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to}
            onClick={() => onMobileClose()}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} className="sidebar-item-label overflow-hidden">
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {!collapsed && <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 mt-3">Account</p>}
        <div className="mt-1">
          {BOTTOM_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to}
              onClick={() => onMobileClose()}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }} className="sidebar-item-label overflow-hidden">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/06 p-3 flex-shrink-0">
        {!collapsed && (
          <NavLink to="/profile" onClick={() => onMobileClose()}
            className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-xl bg-white/04 hover:bg-white/08 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{displayName || 'My Account'}</p>
              <p className="text-white/35 text-[10px] truncate">{user?.email}</p>
            </div>
          </NavLink>
        )}
        <button onClick={handleSignOut}
          className="sidebar-item text-red-400/70 hover:text-red-400 hover:bg-red-400/10 w-full">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }} className="sidebar-item-label overflow-hidden">
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  )

  const sidebarWidth = collapsed ? 64 : 220

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #120630 0%, #0D0221 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {inner}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden fixed left-0 top-0 h-full w-[220px] z-50 flex flex-col overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #120630 0%, #0D0221 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
              {inner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const { displayName, initials } = useAuth()

  const pageName: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/predict': 'Health Prediction',
    '/suggestions': 'Health Suggestions',
    '/chat': 'AI Chat Assistant',
    '/analyze': 'Medical Image Analysis',
    '/reports': 'Reports',
    '/profile': 'Profile',
    '/settings': 'Settings',
  }
  const title = pageName[location.pathname] ?? 'HealthSense AI'

  return (
    <header className="h-14 flex items-center gap-4 px-4 border-b border-white/06 flex-shrink-0"
      style={{ background: 'rgba(13,2,33,0.95)', backdropFilter: 'blur(12px)' }}>
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg bg-white/05 text-white/60 hover:text-white transition-colors">
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-white font-bold text-base">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <NavLink to="/settings" className="hidden sm:flex items-center gap-2 bg-white/04 hover:bg-white/08 border border-white/07 rounded-xl px-3 py-1.5 transition-colors" title="Settings & Profile">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">{initials}</span>
          </div>
          <span className="text-white/70 text-xs font-medium">{displayName || 'My Account'}</span>
        </NavLink>
      </div>
    </header>
  )
}
