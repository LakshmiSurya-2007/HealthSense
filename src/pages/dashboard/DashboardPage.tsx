import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import {
  Brain, Heart, Activity, Droplets, Plus, TrendingUp,
  Clock, ArrowRight, Sparkles, Zap, BarChart3, Target,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { listUserAssessments } from '@/services/assessmentService'
import type { SavedReportData } from '@/services/assessmentService'
import { CircularProgress, RiskBar } from '@/components/charts/ProgressCharts'
import { Spinner } from '@/components/ui/Spinner'

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1a0840', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 },
  cursor: { fill: 'rgba(147,51,234,0.06)' },
}

function StatCard({ label, value, sub, icon: I, gradient, glow }: {
  label: string; value: string | number; sub: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; gradient: string; glow: string
}) {
  return (
    <motion.div whileHover={{ scale: 1.025, y: -3 }}
      className="glass-card p-5 relative overflow-hidden cursor-default">
      <div className="absolute inset-0 opacity-10 rounded-[20px]" style={{ background: gradient }} />
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15" style={{ background: glow, transform: 'translate(30%,-30%)' }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: glow + '25' }}>
            <I className="w-5 h-5" style={{ color: glow }} />
          </div>
          <TrendingUp className="w-4 h-4 text-white/20" />
        </div>
        <p className="text-3xl font-black text-white leading-none mb-1">{value}</p>
        <p className="text-white/40 text-xs">{sub}</p>
        <p className="text-white/70 text-sm font-semibold mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

export function DashboardPage() {
  const { user, profile, displayName, firstName } = useAuth()
  const [preds, setPreds] = useState<SavedReportData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      try {
        const data = await listUserAssessments(user)
        if (mounted) {
          // Sort ascending by created_at for time trend charts
          const sorted = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          setPreds(sorted)
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [user])

  const latest = preds[preds.length - 1]

  const trendData = preds.slice(-8).map(p => ({
    date: new Date(p.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    Diabetes: p.diabetes_risk, Heart: p.heart_risk, Kidney: p.kidney_risk, Hypertension: p.hypertension_risk,
  }))

  const scoreTrend = preds.slice(-8).map(p => ({
    date: new Date(p.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    Score: p.health_score,
  }))

  const pieData = latest ? [
    { name: 'Diabetes', value: latest.diabetes_risk, fill: '#9333EA' },
    { name: 'Heart', value: latest.heart_risk, fill: '#FF4FCB' },
    { name: 'Hypertension', value: latest.hypertension_risk, fill: '#06b6d4' },
    { name: 'Kidney', value: latest.kidney_risk, fill: '#10b981' },
  ] : []

  const lvlCount = { low: preds.filter(p => p.risk_level === 'low').length, medium: preds.filter(p => p.risk_level === 'medium').length, high: preds.filter(p => p.risk_level === 'high').length }

  const scoreColor = !latest ? '#9333EA' : latest.health_score >= 70 ? '#10b981' : latest.health_score >= 45 ? '#f59e0b' : '#ef4444'

  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{firstName || displayName || 'there'}!</span>
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/predict" className="btn-gradient px-5 py-2.5 text-sm self-start">
          <Plus className="w-4 h-4" /> New Assessment
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-60"><Spinner size={36} className="text-primary" /></div>
      ) : (
        <>
          {/* Stat cards */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Health Score" value={latest?.health_score ?? '--'} sub="out of 100"
              icon={Activity} gradient="linear-gradient(135deg,#9333EA,#6d28d9)" glow="#9333EA" />
            <StatCard label="Diabetes Risk" value={latest ? `${latest.diabetes_risk}%` : '--'}
              sub={latest?.risk_level ?? 'not assessed'}
              icon={Droplets} gradient="linear-gradient(135deg,#FF4FCB,#db2777)" glow="#FF4FCB" />
            <StatCard label="Heart Risk" value={latest ? `${latest.heart_risk}%` : '--'}
              sub={latest?.risk_level ?? 'not assessed'}
              icon={Heart} gradient="linear-gradient(135deg,#ef4444,#b91c1c)" glow="#ef4444" />
            <StatCard label="Assessments" value={preds.length} sub="total completed"
              icon={Brain} gradient="linear-gradient(135deg,#06b6d4,#0284c7)" glow="#06b6d4" />
          </motion.div>

          {/* Latest result + score */}
          {latest && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="grid md:grid-cols-2 gap-5">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-white font-bold text-sm">Latest Risk Profile</h3>
                  </div>
                  <span className={`badge-${latest.risk_level} capitalize`}>
                    {latest.risk_level} Risk
                  </span>
                </div>
                <div className="space-y-3.5">
                  <RiskBar label="Diabetes" value={latest.diabetes_risk} color="#9333EA" />
                  <RiskBar label="Heart Disease" value={latest.heart_risk} color="#FF4FCB" />
                  <RiskBar label="Hypertension" value={latest.hypertension_risk} color="#06b6d4" />
                  <RiskBar label="Kidney Disease" value={latest.kidney_risk} color="#10b981" />
                </div>
                <p className="text-white/30 text-xs mt-4">
                  Assessed {new Date(latest.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="glass-card p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="w-4 h-4 text-secondary" />
                  <h3 className="text-white font-bold text-sm">Health Score Overview</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-5 flex-1">
                  <CircularProgress score={latest.health_score} size={150} color={scoreColor}
                    label={latest.health_score >= 70 ? 'Good Health' : latest.health_score >= 45 ? 'Needs Attention' : 'Action Required'} />
                  <div className="flex-1 w-full space-y-2">
                    {pieData.length > 0 && (
                      <ResponsiveContainer width="100%" height={130}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={55} paddingAngle={2} dataKey="value">
                            {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Pie>
                          <Tooltip {...TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                          <span className="text-[11px] text-white/55">{d.name}: <strong className="text-white">{d.value}%</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Insights */}
          {latest?.recommendations?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-secondary" />
                  <h3 className="text-white font-bold text-sm">AI Health Insights</h3>
                </div>
                <Link to="/suggestions" className="text-primary hover:text-secondary text-xs font-semibold flex items-center gap-1 transition-colors">
                  Full suggestions <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(latest.recommendations as string[]).slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/03 border border-white/06">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-white/70 text-xs leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Charts row */}
          {trendData.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid lg:grid-cols-2 gap-5">
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="text-white font-bold text-sm">Risk Trends Over Time</h3>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={trendData}>
                    <defs>
                      {[['d','#9333EA'],['h','#FF4FCB'],['k','#10b981'],['hy','#06b6d4']].map(([id,c]) => (
                        <linearGradient key={id} id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={c} stopOpacity={0.22}/>
                          <stop offset="95%" stopColor={c} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                    <Area type="monotone" dataKey="Diabetes"     stroke="#9333EA" fill="url(#gd)"  strokeWidth={1.8} />
                    <Area type="monotone" dataKey="Heart"        stroke="#FF4FCB" fill="url(#gh)"  strokeWidth={1.8} />
                    <Area type="monotone" dataKey="Hypertension" stroke="#06b6d4" fill="url(#ghy)" strokeWidth={1.8} />
                    <Area type="monotone" dataKey="Kidney"       stroke="#10b981" fill="url(#gk)"  strokeWidth={1.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Activity className="w-4 h-4 text-secondary" />
                  <h3 className="text-white font-bold text-sm">Health Score Trend</h3>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={scoreTrend}>
                    <defs>
                      <linearGradient id="gscore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333EA" stopOpacity={0.28}/>
                        <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
                    <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="Score" stroke="#9333EA" fill="url(#gscore)" strokeWidth={2} dot={{ r: 3.5, fill: '#9333EA', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Bar chart + risk distribution */}
          {preds.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
              className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="text-white font-bold text-sm">Comparative Risk Chart</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData.length ? trendData : (latest ? [{ date: 'Latest', Diabetes: latest.diabetes_risk, Heart: latest.heart_risk, Hypertension: latest.hypertension_risk, Kidney: latest.kidney_risk }] : [])}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                    <Bar dataKey="Diabetes"     fill="#9333EA" radius={[3,3,0,0]} />
                    <Bar dataKey="Heart"        fill="#FF4FCB" radius={[3,3,0,0]} />
                    <Bar dataKey="Hypertension" fill="#06b6d4" radius={[3,3,0,0]} />
                    <Bar dataKey="Kidney"       fill="#10b981" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-white font-bold text-sm mb-5">Risk Level Distribution</h3>
                <div className="space-y-3.5">
                  {[{ label: 'Low Risk', count: lvlCount.low, color: '#10b981', total: preds.length },
                    { label: 'Medium Risk', count: lvlCount.medium, color: '#f59e0b', total: preds.length },
                    { label: 'High Risk', count: lvlCount.high, color: '#ef4444', total: preds.length }].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">{r.label}</span>
                        <span className="text-white font-bold">{r.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/08 overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          style={{ background: r.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${r.total ? (r.count / r.total) * 100 : 0}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-white/06">
                  <p className="text-white/35 text-xs">Total assessments</p>
                  <p className="text-3xl font-black text-white mt-0.5">{preds.length}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* History table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/06">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-white font-bold text-sm">Assessment History</h3>
              </div>
              {preds.length > 0 && (
                <Link to="/predict" className="text-primary hover:text-secondary text-xs font-semibold flex items-center gap-1 transition-colors">
                  New <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            {preds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-white/45 text-sm font-medium">No assessments yet</p>
                <Link to="/predict" className="btn-gradient px-5 py-2 text-xs">Run First Assessment</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/05">
                      {['Date','Diabetes','Heart','Hypertension','Kidney','Score','Level','Report'].map(h => (
                        <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-white/25">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...preds].reverse().slice(0, 8).map(p => (
                      <tr key={p.id} className="border-b border-white/04 hover:bg-white/04 transition-colors">
                        <td className="px-5 py-3 text-white/50 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3 font-bold text-purple-400">{p.diabetes_risk}%</td>
                        <td className="px-5 py-3 font-bold text-pink-400">{p.heart_risk}%</td>
                        <td className="px-5 py-3 font-bold text-cyan-400">{p.hypertension_risk}%</td>
                        <td className="px-5 py-3 font-bold text-emerald-400">{p.kidney_risk}%</td>
                        <td className="px-5 py-3 font-bold text-white">{p.health_score}</td>
                        <td className="px-5 py-3"><span className={`badge-${p.risk_level} capitalize`}>{p.risk_level}</span></td>
                        <td className="px-5 py-3">
                          <Link to={`/results/${p.id}`} className="text-primary hover:text-secondary text-xs font-semibold">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
