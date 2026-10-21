import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Menu, X, User, LogOut, LayoutDashboard, Brain, Bot } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const links = user
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/predict', label: 'Predict', icon: Brain },
        { to: '/chat', label: 'AI Chat', icon: Bot },
      ]
    : [
        { to: '/#features', label: 'Features' },
        { to: '/#how', label: 'How It Works' },
        { to: '/#faq', label: 'FAQ' },
      ]

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-glass' : ''}`}
      style={{ borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
    >
      <div className="container px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text">HealthSense</span>
            <span className="text-white/80 ml-1">AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === l.to
                  ? 'text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/06'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm text-white/80 font-medium max-w-[120px] truncate">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <button onClick={handleSignOut} className="btn-secondary px-3 py-1.5 text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-secondary px-4 py-2 text-sm">Sign In</Link>
              <Link to="/signup" className="btn-gradient px-4 py-2 text-sm">Get Started Free</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(p => !p)} className="md:hidden p-2 rounded-lg glass text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/06 px-6 pb-4"
          >
            <div className="pt-4 space-y-1">
              {links.map(l => (
                <Link key={l.to} to={l.to}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/08 transition-all text-sm font-medium">
                  {l.label}
                </Link>
              ))}
              {user ? (
                <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 transition-all text-sm font-medium mt-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link to="/login" className="flex-1 btn-secondary py-2 text-sm text-center">Sign In</Link>
                  <Link to="/signup" className="flex-1 btn-gradient py-2 text-sm text-center">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
