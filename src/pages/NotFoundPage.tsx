import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg bg-mesh flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-9xl font-black gradient-text mb-4">404</div>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-white/50 mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-gradient px-8 py-3">
          <Home className="w-4 h-4" /> Go Home
        </Link>
      </motion.div>
    </div>
  )
}
