import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { runPredictions, calculateBMI, getBMICategory } from '@/services/predictions'
import type { HealthInput } from '@/services/predictions'
import { saveAssessment } from '@/services/assessmentService'
import { Spinner } from '@/components/ui/Spinner'
import { Brain, ChevronRight, AlertCircle, Info, CheckCircle2, RefreshCw } from 'lucide-react'

const STEPS = ['Personal Info', 'Vitals', 'Lifestyle', 'Family History']

interface FormData {
  age: string
  gender: string
  height_cm: string
  weight_kg: string
  glucose: string
  blood_pressure_sys: string
  blood_pressure_dia: string
  cholesterol: string
  heart_rate: string
  smoking_status: string
  alcohol_consumption: string
  sleep_hours: string
  physical_activity: string
  family_diabetes: boolean
  family_heart: boolean
  family_hypertension: boolean
  family_kidney: boolean
}

const INIT: FormData = {
  age: '',
  gender: '',
  height_cm: '',
  weight_kg: '',
  glucose: '',
  blood_pressure_sys: '',
  blood_pressure_dia: '',
  cholesterol: '',
  heart_rate: '',
  smoking_status: 'never',
  alcohol_consumption: 'none',
  sleep_hours: '7',
  physical_activity: 'moderate',
  family_diabetes: false,
  family_heart: false,
  family_hypertension: false,
  family_kidney: false,
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="tooltip-wrap ml-1.5 cursor-help">
      <Info className="w-3.5 h-3.5 text-white/35 hover:text-primary transition-colors" />
      <div className="tooltip-box">{text}</div>
    </div>
  )
}

function Field({ label, tooltip, children, error }: { label: string; tooltip?: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <div className="flex items-center mb-1.5">
        <label className="text-sm font-medium text-white/75">{label}</label>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function NInput({ value, onChange, placeholder, min, max }: {
  value: string; onChange: (v: string) => void; placeholder?: string; min?: number; max?: number
}) {
  return (
    <input className="input-dark" type="number" inputMode="decimal"
      placeholder={placeholder} min={min} max={max} value={value}
      onChange={e => onChange(e.target.value)} />
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select className="input-dark" value={value} onChange={e => onChange(e.target.value)}
      style={{ backgroundImage: 'none' }}>
      {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a0840' }}>{o.label}</option>)}
    </select>
  )
}

export function PredictionPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>({ ...INIT })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k: keyof FormData, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  const hNum = parseFloat(form.height_cm) || 0
  const wNum = parseFloat(form.weight_kg) || 0
  const bmi = hNum > 0 && wNum > 0 ? calculateBMI(hNum, wNum) : null
  const bmiInfo = bmi ? getBMICategory(bmi) : null

  function validateStep(s: number): boolean {
    setErr('')
    if (s === 0) {
      const ageNum = parseInt(form.age)
      if (!form.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        setErr('Please enter a valid age between 1 and 120.')
        return false
      }
      if (!form.gender) {
        setErr('Please select your biological sex / gender.')
        return false
      }
      if (form.height_cm && (parseFloat(form.height_cm) < 80 || parseFloat(form.height_cm) > 260)) {
        setErr('Height should be between 80 cm and 260 cm.')
        return false
      }
      if (form.weight_kg && (parseFloat(form.weight_kg) < 25 || parseFloat(form.weight_kg) > 350)) {
        setErr('Weight should be between 25 kg and 350 kg.')
        return false
      }
    }
    return true
  }

  function handleNext() {
    if (!validateStep(step)) return
    setStep(p => Math.min(STEPS.length - 1, p + 1))
  }

  // Persistence & retry states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [activeReportPayload, setActiveReportPayload] = useState<{
    id: string
    created_at: string
    input: HealthInput
    result: any
  } | null>(null)

  async function executeSave(payload: { id: string; created_at: string; input: HealthInput; result: any }) {
    setSaving(true)
    setSaveStatus('saving')
    setErr('')

    const saveRes = await saveAssessment({
      id: payload.id,
      input: payload.input,
      result: payload.result,
      createdAt: payload.created_at,
    }, user)

    if (saveRes.success) {
      setSaveStatus('success')
      setSaveSuccessMsg('Assessment report securely saved to your account!')
      setTimeout(() => {
        navigate(`/results/${payload.id}`, { state: { ...payload, isSaved: true } })
      }, 650)
    } else {
      setSaveStatus('error')
      setSaving(false)
      setErr(saveRes.error || 'Failed to save health report to database.')
    }
  }

  async function handleRetrySave() {
    if (!activeReportPayload) return
    await executeSave(activeReportPayload)
  }

  function handleContinueWithoutSave() {
    if (!activeReportPayload) return
    navigate(`/results/${activeReportPayload.id}`, {
      state: { ...activeReportPayload, isSaved: false, saveError: err }
    })
  }

  async function finish() {
    if (!validateStep(0)) {
      setStep(0)
      return
    }

    setSaving(true)
    setSaveStatus('saving')
    setErr('')

    try {
      const parsedAge = parseInt(form.age) || 35
      const parsedHeight = parseFloat(form.height_cm) || 170
      const parsedWeight = parseFloat(form.weight_kg) || 70
      const calculatedBmi = calculateBMI(parsedHeight, parsedWeight)

      const input: HealthInput = {
        age: parsedAge,
        gender: form.gender,
        height_cm: parsedHeight,
        weight_kg: parsedWeight,
        bmi: calculatedBmi,
        glucose: parseFloat(form.glucose) || 95,
        blood_pressure_sys: parseInt(form.blood_pressure_sys) || 120,
        blood_pressure_dia: parseInt(form.blood_pressure_dia) || 80,
        cholesterol: parseFloat(form.cholesterol) || 185,
        heart_rate: parseInt(form.heart_rate) || 72,
        smoking_status: form.smoking_status,
        alcohol_consumption: form.alcohol_consumption,
        sleep_hours: parseFloat(form.sleep_hours) || 7,
        physical_activity: form.physical_activity,
        family_diabetes: form.family_diabetes,
        family_heart: form.family_heart,
        family_hypertension: form.family_hypertension,
        family_kidney: form.family_kidney,
      }

      // 1. Run local structured educational risk engine
      const result = runPredictions(input)
      // Consistent ID to prevent duplicate records on retry
      const savedId = activeReportPayload?.id || crypto.randomUUID()
      const createdAt = activeReportPayload?.created_at || new Date().toISOString()

      const reportPayload = {
        id: savedId,
        created_at: createdAt,
        input,
        result,
      }
      setActiveReportPayload(reportPayload)

      // 2. Persist to Supabase and client backup
      await executeSave(reportPayload)
    } catch (e: unknown) {
      setSaveStatus('error')
      setSaving(false)
      setErr(e instanceof Error ? e.message : 'Failed to generate assessment. Please check your inputs.')
    }
  }

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Health Risk Assessment</h1>
        </div>
        <p className="text-white/45 text-sm ml-13">Enter your health measurements to generate an educational risk estimation report.</p>
      </motion.div>

      {/* Step bar */}
      <div className="relative flex items-start justify-between mb-7">
        <div className="absolute top-4 left-0 right-0 h-px bg-white/07 -z-10" />
        <motion.div className="absolute top-4 left-0 h-px bg-gradient-to-r from-primary to-secondary -z-10 transition-all duration-500"
          style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => { if (i < step || validateStep(step)) setStep(i) }}
            className="flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i === step ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-neon scale-110' :
              i < step ? 'bg-emerald-500 text-white' : 'bg-white/08 text-white/40'
            }`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-[10px] text-white/50 hidden sm:block text-center max-w-[60px] leading-tight">{s}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
        className="glass-card p-7">
        {saveSuccessMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 mb-5 text-sm text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" /> {saveSuccessMsg}
          </motion.div>
        )}

        {err && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 mb-5 text-sm text-red-300 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-200">Database Saving Notice</p>
                <p className="text-red-300/80 text-xs mt-0.5 leading-relaxed">{err}</p>
              </div>
            </div>
            {activeReportPayload && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-500/15">
                <button
                  type="button"
                  onClick={handleRetrySave}
                  disabled={saving}
                  className="btn-primary text-xs py-1.5 px-3 bg-red-600/80 hover:bg-red-600 border-none flex items-center gap-1.5"
                >
                  {saving ? <Spinner size={12} className="text-white" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Retry Saving to Account
                </button>
                <button
                  type="button"
                  onClick={handleContinueWithoutSave}
                  className="btn-secondary text-xs py-1.5 px-3 text-white/70 hover:text-white"
                >
                  Continue to View Report →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 0 — Personal */}
        {step === 0 && (
          <div>
            <h2 className="text-base font-bold text-white mb-5">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Age *" tooltip="Your current age in years.">
                <NInput value={form.age} onChange={v => set('age', v)} placeholder="e.g. 35" min={1} max={120} />
              </Field>
              <Field label="Biological Sex *" tooltip="Biological sex affects risk baselines for cardiovascular conditions.">
                <Select value={form.gender} onChange={v => set('gender', v)} options={[
                  { value: '', label: 'Select sex' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other / Prefer not to say' },
                ]} />
              </Field>
              <Field label="Height (cm)" tooltip="Used alongside weight to accurately calculate your Body Mass Index (BMI).">
                <NInput value={form.height_cm} onChange={v => set('height_cm', v)} placeholder="e.g. 175" min={100} max={250} />
              </Field>
              <Field label="Weight (kg)" tooltip="Your current body weight in kilograms.">
                <NInput value={form.weight_kg} onChange={v => set('weight_kg', v)} placeholder="e.g. 70" min={20} max={300} />
              </Field>
            </div>

            {bmi && bmiInfo && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="mt-5 p-4 rounded-xl bg-primary/08 border border-primary/18 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-white/45">Calculated BMI</p>
                  <p className="text-3xl font-black text-primary">{bmi}</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm font-semibold">{bmiInfo.label}</p>
                  <div className="h-1.5 rounded-full bg-white/10 w-48 mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (bmi / 40) * 100)}%`,
                        background: bmiInfo.color
                      }} />
                  </div>
                  <p className="text-white/35 text-[10px] mt-1">WHO standard: 18.5 – 24.9 kg/m² is normal weight</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Step 1 — Vitals */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-bold text-white mb-1">Medical Vitals</h2>
            <p className="text-white/40 text-xs mb-5">Enter values from your recent check-up or leave blank to use healthy population defaults.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Fasting Blood Glucose (mg/dL)"
                tooltip="Normal fasting: 70–99 mg/dL. Pre-diabetes: 100–125 mg/dL. Diabetes: ≥126 mg/dL.">
                <NInput value={form.glucose} onChange={v => set('glucose', v)} placeholder="e.g. 95 (Normal <100)" min={40} max={600} />
              </Field>
              <Field label="Total Cholesterol (mg/dL)"
                tooltip="Desirable: <200 mg/dL. Borderline high: 200–239 mg/dL. High: ≥240 mg/dL.">
                <NInput value={form.cholesterol} onChange={v => set('cholesterol', v)} placeholder="e.g. 185 (Desirable <200)" min={50} max={500} />
              </Field>
              <Field label="Systolic Blood Pressure (mmHg)"
                tooltip="Top number in BP reading. Normal: <120 mmHg. Elevated: 120-129. Stage 1: ≥130.">
                <NInput value={form.blood_pressure_sys} onChange={v => set('blood_pressure_sys', v)} placeholder="e.g. 120 (Normal <120)" min={60} max={250} />
              </Field>
              <Field label="Diastolic Blood Pressure (mmHg)"
                tooltip="Bottom number in BP reading. Normal: <80 mmHg. Stage 1: ≥80. Stage 2: ≥90.">
                <NInput value={form.blood_pressure_dia} onChange={v => set('blood_pressure_dia', v)} placeholder="e.g. 80 (Normal <80)" min={40} max={150} />
              </Field>
              <Field label="Resting Heart Rate (bpm)"
                tooltip="Resting pulse in beats per minute. Normal range: 60–100 bpm.">
                <NInput value={form.heart_rate} onChange={v => set('heart_rate', v)} placeholder="e.g. 72" min={30} max={220} />
              </Field>
            </div>
            <div className="mt-5 p-4 rounded-xl bg-white/03 border border-white/07 text-xs text-white/45 leading-relaxed">
              <strong className="text-white/60">Helpful Note:</strong> You can leave any unmeasured test fields blank. HealthSense AI will calculate risk using standardized population reference baselines.
            </div>
          </div>
        )}

        {/* Step 2 — Lifestyle */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-bold text-white mb-5">Lifestyle Factors</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Smoking Status"
                tooltip="Smoking significantly increases cardiovascular and arterial risk.">
                <Select value={form.smoking_status} onChange={v => set('smoking_status', v)} options={[
                  { value: 'never', label: 'Never smoked' },
                  { value: 'former', label: 'Former smoker (quit)' },
                  { value: 'current', label: 'Current smoker' },
                ]} />
              </Field>
              <Field label="Alcohol Consumption"
                tooltip="Excessive alcohol consumption contributes to hypertension and metabolic load.">
                <Select value={form.alcohol_consumption} onChange={v => set('alcohol_consumption', v)} options={[
                  { value: 'none', label: 'None (0 drinks/week)' },
                  { value: 'light', label: 'Light (1–2 drinks/week)' },
                  { value: 'moderate', label: 'Moderate (3–7 drinks/week)' },
                  { value: 'heavy', label: 'Heavy (8+ drinks/week)' },
                ]} />
              </Field>
              <Field label="Physical Activity Level"
                tooltip="WHO guidelines recommend ≥150 minutes of moderate aerobic activity weekly.">
                <Select value={form.physical_activity} onChange={v => set('physical_activity', v)} options={[
                  { value: 'sedentary', label: 'Sedentary — little to no exercise' },
                  { value: 'light', label: 'Light — 1–2 days/week' },
                  { value: 'moderate', label: 'Moderate — 3–5 days/week' },
                  { value: 'active', label: 'Active — 6–7 days/week' },
                ]} />
              </Field>
              <Field label={`Sleep Duration — ${form.sleep_hours} hrs/night`}
                tooltip="Adults need 7–9 hours of sleep per night for metabolic and hormonal balance.">
                <div className="pt-2">
                  <input type="range" min="4" max="12" step="0.5"
                    value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-[10px] text-white/30 mt-1">
                    <span>4h</span><span className="text-emerald-400">7–9h optimal</span><span>12h</span>
                  </div>
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* Step 3 — Family History */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-bold text-white mb-1">Family Medical History</h2>
            <p className="text-white/40 text-xs mb-5">
              Select any conditions diagnosed in first-degree biological relatives (parents or siblings).
            </p>
            <div className="space-y-3">
              {([
                { key: 'family_diabetes' as const, label: 'Type 2 Diabetes', desc: 'Parent or sibling diagnosed with diabetes', color: '#9333EA', tip: 'Family history approximately doubles individual risk due to shared genetics and habits.' },
                { key: 'family_heart' as const, label: 'Heart Disease', desc: 'Coronary artery disease, heart attack, or stroke in immediate family', color: '#FF4FCB', tip: 'Premature cardiovascular disease in family members is a critical risk factor.' },
                { key: 'family_hypertension' as const, label: 'Hypertension', desc: 'High blood pressure requiring prescription management', color: '#06b6d4', tip: 'Genetic predisposition strongly influences vascular tone and sodium sensitivity.' },
                { key: 'family_kidney' as const, label: 'Kidney Disease', desc: 'Chronic kidney disease, polycystic kidney, or renal failure', color: '#10b981', tip: 'Family renal history combined with blood pressure influences filtration health.' },
              ] as const).map(c => (
                <label key={c.key} className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${form[c.key] ? 'bg-primary/08 border-primary/25' : 'bg-white/03 border-white/07 hover:border-white/14'}`}>
                  <input type="checkbox" checked={form[c.key]} onChange={e => set(c.key, e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary rounded flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{c.label}</p>
                      <div className="tooltip-wrap">
                        <Info className="w-3.5 h-3.5 text-white/30 hover:text-primary cursor-help transition-colors" />
                        <div className="tooltip-box">{c.tip}</div>
                      </div>
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">{c.desc}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: c.color }} />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/07">
          <button disabled={step === 0} onClick={() => setStep(p => p - 1)}
            className="btn-secondary disabled:opacity-25 px-5 py-2.5 text-sm">
            ← Previous
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} className="btn-gradient px-6 py-2.5 text-sm">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving || saveStatus === 'success'}
              className="btn-gradient px-7 py-2.5 text-sm flex items-center gap-2 font-bold shadow-neon disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Spinner size={16} className="text-white" />
                  <span>Saving Report…</span>
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved! Opening…</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Generate Health Report</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
