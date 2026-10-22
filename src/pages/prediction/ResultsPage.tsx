import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { getAssessmentById, saveAssessment } from '@/services/assessmentService'
import { CircularProgress, RiskBar } from '@/components/charts/ProgressCharts'
import { Spinner } from '@/components/ui/Spinner'
import { runPredictions, calculateBMI, getBMICategory } from '@/services/predictions'
import type { HealthInput, PredictionResult } from '@/services/predictions'
import {
  Brain, Heart, Activity, Droplets, Download, LayoutDashboard,
  AlertTriangle, CheckCircle2, ArrowRight, Sparkles,
  BookOpen, ChevronRight, Scale, Gauge, ShieldAlert, AlertCircle,
  Bot, RefreshCw, Check
} from 'lucide-react'
import { DoctorRecommendations } from '@/components/recommendations/DoctorRecommendations'
import { getRecommendedProvidersForReport } from '@/data/sampleHealthcareProviders'
import { generateHealthReportPdf } from '@/services/pdfReportService'

interface ReportData {
  id: string
  created_at: string
  health_score: number
  risk_level: 'low' | 'medium' | 'high'
  diabetes_risk: number
  heart_risk: number
  hypertension_risk: number
  kidney_risk: number
  recommendations: string[]
  input?: HealthInput
  category_details?: PredictionResult['category_details']
}

const RISK_INFO = {
  low: { label: 'Low Overall Risk', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  medium: { label: 'Moderate Risk', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
  high: { label: 'Elevated Risk', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
}

const SCORE_INFO = (s: number) =>
  s >= 70 ? { label: 'Strong Health Indicators', color: '#10b981', msg: 'Your metabolic and lifestyle markers indicate strong overall vitality.' }
  : s >= 45 ? { label: 'Moderate / Needs Attention', color: '#f59e0b', msg: 'Selected metabolic or lifestyle factors warrant proactive improvement.' }
  : { label: 'Action Recommended', color: '#ef4444', msg: 'Multiple health parameters require active lifestyle optimization and physician consultation.' }

const DEFAULT_EXPLANATIONS: Record<string, { title: string; normal: string; note: string }> = {
  diabetes: {
    title: 'Type 2 Diabetes Risk',
    normal: 'Normal fasting blood glucose is 70–99 mg/dL. Pre-diabetes is 100–125 mg/dL.',
    note: 'Driven by fasting glucose, BMI, genetic family history, and physical inactivity.'
  },
  heart: {
    title: 'Cardiovascular Risk',
    normal: 'Optimal blood pressure is <120/80 mmHg. Desirable total cholesterol is <200 mg/dL.',
    note: 'Elevated systolic pressure, cholesterol, smoking, and age are primary contributors.'
  },
  hypertension: {
    title: 'Hypertension Risk',
    normal: 'Normal systolic is <120 mmHg and diastolic is <80 mmHg.',
    note: 'Vascular resistance increases with sodium intake, excess body weight, and hereditary factors.'
  },
  kidney: {
    title: 'Kidney Health Burden',
    normal: 'Normal kidneys filter blood continuously; eGFR should typically be >60–90 mL/min.',
    note: 'Uncontrolled blood pressure and prolonged high blood glucose are the primary kidney stressors.'
  }
}

export function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, displayName } = useAuth()

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState<boolean | null>(null)
  const [savingToDb, setSavingToDb] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadReport() {
      setLoading(true)
      const statePayload = location.state as {
        id?: string
        created_at?: string
        input?: HealthInput
        result?: PredictionResult
        isSaved?: boolean
        saveError?: string
      } | null

      // Check if full state was passed from navigation
      if (statePayload?.result) {
        if (!isMounted) return
        setReport({
          id: statePayload.id || id || 'latest',
          created_at: statePayload.created_at || new Date().toISOString(),
          health_score: statePayload.result.health_score,
          risk_level: statePayload.result.risk_level,
          diabetes_risk: statePayload.result.diabetes_risk,
          heart_risk: statePayload.result.heart_risk,
          hypertension_risk: statePayload.result.hypertension_risk,
          kidney_risk: statePayload.result.kidney_risk,
          recommendations: statePayload.result.recommendations,
          input: statePayload.input,
          category_details: statePayload.result.category_details,
        })
        setIsSaved(statePayload.isSaved ?? false)
        if (statePayload.saveError) {
          setSaveError(statePayload.saveError)
        }
        setLoading(false)
        return
      }

      // Otherwise fetch persistently from database using assessmentService
      const targetId = id || 'latest'
      const record = await getAssessmentById(targetId, user)

      if (!isMounted) return
      if (record) {
        setReport({
          id: record.id,
          created_at: record.created_at || record.assessment_date || new Date().toISOString(),
          health_score: record.health_score,
          risk_level: record.risk_level,
          diabetes_risk: record.diabetes_risk,
          heart_risk: record.heart_risk,
          hypertension_risk: record.hypertension_risk,
          kidney_risk: record.kidney_risk,
          recommendations: record.suggestions || [],
          input: record.input_parameters,
          category_details: record.complete_report?.result?.category_details,
        })
        setIsSaved(true)
      } else {
        // Fallback to local session storage
        try {
          const cached = sessionStorage.getItem('healthsense_latest_report')
          if (cached) {
            const parsed = JSON.parse(cached)
            setReport({
              id: parsed.id,
              created_at: parsed.created_at,
              health_score: parsed.result.health_score,
              risk_level: parsed.result.risk_level,
              diabetes_risk: parsed.result.diabetes_risk,
              heart_risk: parsed.result.heart_risk,
              hypertension_risk: parsed.result.hypertension_risk,
              kidney_risk: parsed.result.kidney_risk,
              recommendations: parsed.result.recommendations,
              input: parsed.input,
              category_details: parsed.result.category_details,
            })
            setIsSaved(false)
          }
        } catch {}
      }
      setLoading(false)
    }

    loadReport()
    return () => { isMounted = false }
  }, [id, location.state, user])

  async function handleSaveToAccount() {
    if (!report || !report.input) return
    setSavingToDb(true)
    setSaveError('')
    setSaveMsg('')

    const fullResult: PredictionResult = report.category_details
      ? {
          diabetes_risk: report.diabetes_risk,
          heart_risk: report.heart_risk,
          hypertension_risk: report.hypertension_risk,
          kidney_risk: report.kidney_risk,
          health_score: report.health_score,
          risk_level: report.risk_level,
          recommendations: report.recommendations,
          category_details: report.category_details,
          prototype_disclaimer: '',
        }
      : runPredictions(report.input)

    const res = await saveAssessment({
      id: report.id,
      input: report.input,
      result: fullResult,
      createdAt: report.created_at,
    }, user)

    setSavingToDb(false)
    if (res.success) {
      setIsSaved(true)
      setSaveMsg('Report successfully saved to your cloud account!')
    } else {
      setSaveError(res.error || 'Failed to save report to account.')
    }
  }

  function handleAskAI() {
    if (!report) return
    navigate(`/chat?reportId=${encodeURIComponent(report.id)}`, {
      state: { report }
    })
  }

  function downloadReport() {
    if (!report) return
    try {
      generateHealthReportPdf(report, {
        patientName: displayName && displayName !== 'My Account' ? displayName : undefined
      })
    } catch (err: any) {
      console.error('Failed to generate PDF report:', err)
      setSaveError(err.message || 'Could not generate PDF report.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-28 gap-3">
        <Spinner size={36} className="text-primary" />
        <p className="text-white/40 text-xs">Loading health report…</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-28 gap-4 max-w-md mx-auto text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-white/05 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-white/30" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Report Not Found</h2>
          <p className="text-white/45 text-xs leading-relaxed">
            We couldn't retrieve this report. Please submit a new assessment to generate an instant report.
          </p>
        </div>
        <button onClick={() => navigate('/predict')} className="btn-gradient px-6 py-2.5 text-xs">
          Start New Assessment
        </button>
      </div>
    )
  }

  const cfg = RISK_INFO[report.risk_level] || RISK_INFO.medium
  const Icon = cfg.icon
  const scoreInfo = SCORE_INFO(report.health_score)

  const riskCards = [
    { key: 'diabetes', label: 'Diabetes Risk', value: report.diabetes_risk, color: '#9333EA', icon: Droplets },
    { key: 'heart', label: 'Heart Disease', value: report.heart_risk, color: '#FF4FCB', icon: Heart },
    { key: 'hypertension', label: 'Hypertension', value: report.hypertension_risk, color: '#06b6d4', icon: Activity },
    { key: 'kidney', label: 'Kidney Burden', value: report.kidney_risk, color: '#10b981', icon: Brain },
  ]

  const input = report.input
  const bmiValue = input?.bmi || (input?.height_cm && input?.weight_kg ? calculateBMI(input.height_cm, input.weight_kg) : null)
  const bmiCat = bmiValue ? getBMICategory(bmiValue) : null
  const doctorRecs = getRecommendedProvidersForReport(report)

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h1 className="text-2xl font-black text-white">Your Health Assessment Report</h1>
            {isSaved === true && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Check className="w-3 h-3" /> Saved to Account
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs">Generated on {new Date(report.created_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={downloadReport} className="btn-secondary px-4 py-2 text-xs">
            <Download className="w-3.5 h-3.5" /> Download Report
          </button>
        </div>
      </motion.div>

      {/* Persistence Notification Banners */}
      {saveMsg && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{saveMsg}</span>
        </motion.div>
      )}

      {saveError && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            onClick={handleSaveToAccount}
            disabled={savingToDb}
            className="btn-primary text-xs py-1.5 px-3 bg-red-600/80 hover:bg-red-600 border-none flex items-center gap-1.5"
          >
            {savingToDb ? <Spinner size={12} className="text-white" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Retry Saving
          </button>
        </motion.div>
      )}

      {isSaved === false && !saveError && !saveMsg && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>This assessment report is not yet saved to your Supabase account.</span>
          </div>
          <button
            onClick={handleSaveToAccount}
            disabled={savingToDb}
            className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
          >
            {savingToDb ? <Spinner size={12} className="text-white" /> : <Check className="w-3.5 h-3.5" />}
            Save to Account Now
          </button>
        </motion.div>
      )}

      {/* Educational Prototype Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-white/70 leading-relaxed">
          <strong className="text-secondary font-semibold">Educational Risk-Estimation Prototype:</strong>{' '}
          Scores below are non-diagnostic statistical estimations based on clinical guidelines (ADA, AHA, WHO thresholds). They indicate areas where preventive lifestyle changes have the greatest impact.
        </div>
      </motion.div>

      {/* Risk level banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className={`flex items-center gap-3 p-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
        <Icon className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color }} />
        <div>
          <p className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.label}</p>
          <p className="text-white/60 text-xs mt-0.5">{scoreInfo.msg}</p>
        </div>
        <span className={`ml-auto badge-${report.risk_level} capitalize flex-shrink-0 text-xs font-bold px-3 py-1`}>
          {report.risk_level} Risk
        </span>
      </motion.div>

      {/* Health Score + Progress Bars */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="grid md:grid-cols-2 gap-5">
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <h3 className="text-white font-bold text-sm mb-4 self-start flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" /> Overall Health Score
          </h3>
          <CircularProgress score={report.health_score} size={160} color={scoreInfo.color} label={scoreInfo.label} />
          <div className="mt-4 text-center">
            <p className="text-white/50 text-xs leading-relaxed max-w-xs">
              Score of <strong className="text-white">{report.health_score}/100</strong> synthesized from your submitted blood pressure, glucose, BMI, and lifestyle habits.
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-white font-bold text-sm mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-secondary" /> Condition Risk Breakdown
          </h3>
          <div className="space-y-4">
            <RiskBar label="Type 2 Diabetes" value={report.diabetes_risk} color="#9333EA" />
            <RiskBar label="Cardiovascular Disease" value={report.heart_risk} color="#FF4FCB" />
            <RiskBar label="Hypertension" value={report.hypertension_risk} color="#06b6d4" />
            <RiskBar label="Chronic Kidney Burden" value={report.kidney_risk} color="#10b981" />
          </div>
        </div>
      </motion.div>

      {/* Submitted Health Measurements & BMI Section */}
      {input && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4 text-secondary" />
            <h3 className="text-white font-bold text-sm">Submitted Health Measurements</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* BMI Card */}
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 col-span-2 sm:col-span-1">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Calculated BMI</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{bmiValue ?? '—'}</span>
                <span className="text-xs text-white/40">kg/m²</span>
              </div>
              {bmiCat && (
                <p className="text-xs font-semibold mt-1" style={{ color: bmiCat.color }}>{bmiCat.label}</p>
              )}
            </div>

            {/* Height & Weight */}
            <div className="p-3.5 rounded-xl bg-white/03 border border-white/07">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Height & Weight</p>
              <p className="text-sm font-bold text-white mt-1">{input.height_cm} cm / {input.weight_kg} kg</p>
              <p className="text-white/35 text-[10px] mt-0.5">Demographics: {input.age} yrs • {input.gender}</p>
            </div>

            {/* Blood Pressure */}
            <div className="p-3.5 rounded-xl bg-white/03 border border-white/07">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Blood Pressure</p>
              <p className="text-sm font-bold text-white mt-1">{input.blood_pressure_sys}/{input.blood_pressure_dia} mmHg</p>
              <p className="text-white/35 text-[10px] mt-0.5">Normal: &lt;120/80 mmHg</p>
            </div>

            {/* Fasting Glucose */}
            <div className="p-3.5 rounded-xl bg-white/03 border border-white/07">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Fasting Glucose</p>
              <p className="text-sm font-bold text-white mt-1">{input.glucose} mg/dL</p>
              <p className="text-white/35 text-[10px] mt-0.5">Normal: 70–99 mg/dL</p>
            </div>

            {/* Total Cholesterol */}
            <div className="p-3.5 rounded-xl bg-white/03 border border-white/07">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Cholesterol</p>
              <p className="text-sm font-bold text-white mt-1">{input.cholesterol} mg/dL</p>
              <p className="text-white/35 text-[10px] mt-0.5">Desirable: &lt;200 mg/dL</p>
            </div>

            {/* Heart Rate */}
            <div className="p-3.5 rounded-xl bg-white/03 border border-white/07">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Resting Heart Rate</p>
              <p className="text-sm font-bold text-white mt-1">{input.heart_rate} bpm</p>
              <p className="text-white/35 text-[10px] mt-0.5">Normal: 60–100 bpm</p>
            </div>

            {/* Activity & Sleep */}
            <div className="p-3.5 rounded-xl bg-white/03 border border-white/07">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Activity & Sleep</p>
              <p className="text-sm font-bold text-white mt-1 capitalize">{input.physical_activity}</p>
              <p className="text-white/35 text-[10px] mt-0.5">{input.sleep_hours} hrs/night sleep</p>
            </div>

            {/* Smoking & Alcohol */}
            <div className="p-3.5 rounded-xl bg-white/03 border border-white/07">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Smoking / Alcohol</p>
              <p className="text-sm font-bold text-white mt-1 capitalize">{input.smoking_status} / {input.alcohol_consumption}</p>
              <p className="text-white/35 text-[10px] mt-0.5">Lifestyle risks</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Risk cards with explanations */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {riskCards.map((c, i) => {
          const lvl = c.value >= 50 ? 'high' : c.value >= 25 ? 'medium' : 'low'
          const bgColor = c.value >= 50 ? 'rgba(239,68,68,0.08)' : c.value >= 25 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)'
          const borderColor = c.value >= 50 ? 'rgba(239,68,68,0.2)' : c.value >= 25 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'
          return (
            <motion.div key={c.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="rounded-2xl border p-4 text-center"
              style={{ background: bgColor, borderColor }}>
              <c.icon className="w-5 h-5 mx-auto mb-2.5" style={{ color: c.color }} />
              <div className="text-2xl font-black mb-0.5" style={{ color: c.value >= 50 ? '#ef4444' : c.value >= 25 ? '#f59e0b' : '#10b981' }}>{c.value}%</div>
              <div className="text-white/60 text-xs mb-2 font-medium">{c.label}</div>
              <span className={`badge-${lvl} capitalize text-[10px] font-bold`}>{lvl} risk</span>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Explanations & Key Drivers */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-white font-bold text-sm">Understanding Your Risk Estimates</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3.5">
          {riskCards.map(c => {
            const def = DEFAULT_EXPLANATIONS[c.key]
            const detail = report.category_details?.[c.key as keyof PredictionResult['category_details']]
            return (
              <div key={c.key} className="p-4 rounded-xl bg-white/03 border border-white/06 space-y-2">
                <div className="flex items-center gap-2">
                  <c.icon className="w-4 h-4 flex-shrink-0" style={{ color: c.color }} />
                  <span className="text-white/90 text-xs font-bold">{c.label}</span>
                  <span className="ml-auto font-black text-xs" style={{ color: c.color }}>{c.value}%</span>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">{detail?.explanation || def.normal}</p>
                {detail?.drivers && detail.drivers.length > 0 ? (
                  <div className="pt-1">
                    <p className="text-[10px] text-white/35 font-bold uppercase tracking-wider mb-1">Key Factors Noted:</p>
                    <ul className="space-y-0.5">
                      {detail.drivers.map((d, di) => (
                        <li key={di} className="text-white/70 text-[11px] flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary/70 mt-1.5 flex-shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-white/40 text-[11px]">{def.note}</p>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
        className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            <h3 className="text-white font-bold text-sm">Tailored Preventive Health Suggestions</h3>
          </div>
          <Link to="/suggestions" className="text-primary hover:text-secondary text-xs font-semibold flex items-center gap-1 transition-colors">
            Comprehensive guide <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2.5">
          {(report.recommendations ?? []).map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + i * 0.04 }}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-white/03 border border-white/06">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-primary">{i + 1}</span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{r}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Limitations & Medical Disclaimer */}
      <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/05">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-amber-200/80 text-xs leading-relaxed space-y-1">
            <p>
              <strong className="text-amber-300">Important Limitations & Medical Disclaimer:</strong> This health risk report is an educational risk-estimation prototype. It does not constitute a clinical medical diagnosis, prognosis, or formal risk score (such as an ASCVD risk estimator or laboratory HbA1c test).
            </p>
            <p>
              Individual physiology varies significantly. Always consult a qualified physician or healthcare provider before initiating new diets, rigorous exercise regimens, or making clinical decisions regarding medications.
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Doctors & Hospitals */}
      {doctorRecs && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <DoctorRecommendations
            groups={doctorRecs.groups}
            hasConcerningRisks={doctorRecs.hasConcerningRisks}
            summaryMessage={doctorRecs.summaryMessage}
          />
        </motion.div>
      )}

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
        className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-3">
        <Link to="/dashboard" className="btn-secondary flex-1 py-3 text-xs justify-center min-w-[140px]">
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> Go to Dashboard
        </Link>
        <Link to="/suggestions" className="btn-secondary flex-1 py-3 text-xs justify-center min-w-[180px]">
          <Sparkles className="w-4 h-4 flex-shrink-0" /> View Nutrition &amp; Lifestyle Plan
        </Link>
        <button
          onClick={handleAskAI}
          id="ask-ai-report-btn"
          className="btn-gradient flex-1 py-3 text-xs justify-center shadow-neon font-bold min-w-[140px]"
        >
          <Bot className="w-4 h-4 flex-shrink-0" /> Ask AI
        </button>
        <Link to="/predict" className="btn-secondary flex-1 py-3 text-xs justify-center min-w-[160px]">
          <ChevronRight className="w-4 h-4 flex-shrink-0" /> Start New Assessment
        </Link>
      </motion.div>
    </div>
  )
}
