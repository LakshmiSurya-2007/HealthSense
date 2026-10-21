import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-white/60 text-sm font-medium">Loading HealthSense AI…</p>
      </motion.div>
    </div>
  )
}

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 style={{ width: size, height: size }} className={`animate-spin ${className}`} />
}
