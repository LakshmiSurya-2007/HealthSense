import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { listUserAssessments } from '@/services/assessmentService'
import type { SavedReportData } from '@/services/assessmentService'
import { FileText, Download, Clock, Brain, Activity, Bot } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { Link } from 'react-router-dom'

export function ReportsPage() {
  const { user, displayName } = useAuth()
  const [reports, setReports] = useState<SavedReportData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setReports([])
      setLoading(false)
      return
    }

    listUserAssessments(user).then(data => {
      setReports(data)
      setLoading(false)
    }).catch(err => {
      console.warn('Failed to load user reports:', err)
      setLoading(false)
    })
  }, [user])

  function download(pred: SavedReportData) {
    const txt = [
      '══════════════════════════════════════',
      '      HEALTHSENSE AI — HEALTH REPORT  ',
      '══════════════════════════════════════',
      ...(displayName && displayName !== 'My Account' ? [`Patient / User:      ${displayName}`] : []),
      `Generated:           ${new Date(pred.created_at).toLocaleString()}`,
      `Report ID:           ${pred.id}`,
      '',
      '── RISK SCORES ──────────────────────',
      `Diabetes Risk:       ${pred.diabetes_risk}%`,
      `Heart Disease Risk:  ${pred.heart_risk}%`,
      `Hypertension Risk:   ${pred.hypertension_risk}%`,
      `Kidney Disease Risk: ${pred.kidney_risk}%`,
      `Health Score:        ${pred.health_score}/100`,
      `Risk Level:          ${pred.risk_level.toUpperCase()}`,
      '',
      '── AI RECOMMENDATIONS ───────────────',
      ...(pred.recommendations ?? []).map((r: string, i: number) => `${i + 1}. ${r}`),
      '',
      '── DISCLAIMER ───────────────────────',
      'For educational purposes only. Not medical advice.',
      '    HealthSense AI',
    ].join('\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `healthsense-${new Date(pred.created_at).toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-secondary" />
          <h1 className="text-2xl font-black text-white">Health Reports</h1>
        </div>
        <p className="text-white/40 text-sm">
          Download {displayName && displayName !== 'My Account' ? `${displayName}’s` : 'your'} past health assessment reports or ask AI about any report.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} className="text-primary" /></div>
      ) : reports.length === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center gap-3 text-center">
          <FileText className="w-10 h-10 text-white/15" />
          <p className="text-white/45 font-medium">No reports yet</p>
          <Link to="/predict" className="btn-gradient px-5 py-2 text-sm">Run First Assessment</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <Link to={`/results/${p.id}`} className="flex-1 min-w-0 hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold text-sm hover:text-primary transition-colors">
                    {p.title || 'Health Assessment'}
                  </p>
                  <span className={`badge-${p.risk_level} capitalize text-[10px]`}>{p.risk_level}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white/40 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="text-white/40 text-xs flex items-center gap-1"><Activity className="w-3 h-3" />Score: {p.health_score}/100</span>
                  <span className="text-purple-400 text-xs">D:{p.diabetes_risk}%</span>
                  <span className="text-pink-400 text-xs">H:{p.heart_risk}%</span>
                  <span className="text-cyan-400 text-xs">BP:{p.hypertension_risk}%</span>
                </div>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <Link to={`/results/${p.id}`} className="btn-secondary px-3 py-2 text-xs">
                  View
                </Link>
                <Link
                  to={`/chat?reportId=${p.id}`}
                  className="btn-gradient px-3 py-2 text-xs flex items-center gap-1 font-bold shadow-neon"
                >
                  <Bot className="w-3.5 h-3.5" /> Ask AI
                </Link>
                <button onClick={() => download(p)} className="btn-secondary px-3 py-2 text-xs">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
