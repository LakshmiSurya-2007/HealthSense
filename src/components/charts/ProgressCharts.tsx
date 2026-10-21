import { motion } from 'framer-motion'

interface Props {
  score: number
  size?: number
  label?: string
  color?: string
}

export function CircularProgress({ score, size = 120, label, color = '#9333EA' }: Props) {
  const r = (size / 2) * 0.78
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const cx = size / 2
  const fs = Math.round(size * 0.2)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.08} />
        <motion.circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x={cx} y={cx - 3} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="800" fill="#fff">{score}</text>
        <text x={cx} y={cx + fs * 0.82} textAnchor="middle" dominantBaseline="middle" fontSize={fs * 0.42} fill="rgba(255,255,255,0.5)">/100</text>
      </svg>
      {label && <p className="text-xs text-white/60 font-medium text-center">{label}</p>}
    </div>
  )
}

export function RiskBar({ label, value, color }: { label: string; value: number; color: string }) {
  const lvl = value >= 60 ? 'High' : value >= 30 ? 'Medium' : 'Low'
  const badgeCls = value >= 60 ? 'badge-high' : value >= 30 ? 'badge-medium' : 'badge-low'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/80 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{value}%</span>
          <span className={`badge text-xs px-2 py-0.5 rounded-full ${badgeCls}`}>{lvl}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
