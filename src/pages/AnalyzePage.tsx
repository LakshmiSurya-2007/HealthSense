import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { analyzeImageWithGemini } from '@/services/gemini'
import { Spinner } from '@/components/ui/Spinner'
import {
  Upload, Image as ImageIcon, AlertTriangle, CheckCircle2,
  Brain, X, BarChart3, Stethoscope, Lightbulb, AlertCircle,
  Clock, ChevronDown, ChevronUp, ShieldAlert,
} from 'lucide-react'
import { DoctorRecommendations } from '@/components/recommendations/DoctorRecommendations'
import { getRecommendedProvidersForImageAnalysis } from '@/data/sampleHealthcareProviders'

interface AnalysisResult {
  condition: string
  confidence: number
  description: string
  causes: string[]
  recommendations: string[]
  doctorAdvice: string
}

interface HistoryItem {
  id: string
  image_name: string | null
  condition_name: string | null
  confidence: number | null
  created_at: string
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB = 10

function ClarityBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 rounded-full bg-white/08 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(10, value))}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
      <span className="text-sm font-black text-white w-10 text-right">{value}%</span>
    </div>
  )
}

export function AnalyzePage() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [context, setContext] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setError('')
    if (!ALLOWED.includes(f.type)) {
      setError('Unsupported file type. Please upload a standard JPG, PNG, WebP, or GIF image.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File size (${(f.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${MAX_MB}MB.`)
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.onerror = () => setError('Failed to read image file. Please try selecting it again.')
    reader.readAsDataURL(f)
    setResult(null)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  async function analyze() {
    if (!file || !preview) return
    setAnalyzing(true)
    setError('')
    setResult(null)

    try {
      const base64 = preview.split(',')[1]
      const raw = await analyzeImageWithGemini(base64, file.type, context || undefined)
      let parsed: AnalysisResult

      try {
        parsed = JSON.parse(raw)
      } catch {
        // Fallback structured wrapping
        parsed = {
          condition: 'Visual Observation Completed',
          confidence: 50,
          description: raw,
          causes: ['Visible variation in skin pigmentation, inflammation, or texture'],
          recommendations: ['Keep the area clean, avoid scratching or harsh chemicals, and observe for changes.'],
          doctorAdvice: 'Please consult a board-certified dermatologist for a clinical in-person examination.',
        }
      }

      setResult(parsed)

      // Save to Supabase if authenticated
      if (user) {
        try {
          const { error: insertErr } = await supabase.from('image_analyses').insert({
            user_id: user.id,
            image_path: file.name,
            analysis_result: {
              condition: parsed.condition,
              confidence: parsed.confidence,
              description: parsed.description,
              causes: parsed.causes,
              recommendations: parsed.recommendations,
              doctorAdvice: parsed.doctorAdvice,
              image_size: file.size,
              raw_response: raw,
            },
          })
          if (insertErr) {
            console.warn('Could not persist analysis to Supabase:', insertErr.message)
          } else {
            // Reset history loaded state so it refreshes next time
            setHistoryLoaded(false)
          }
        } catch (dbErr) {
          console.warn('Could not persist analysis to Supabase:', dbErr)
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Analysis failed. Please check your network and try again.'
      setError(msg)
    } finally {
      setAnalyzing(false)
    }
  }

  async function loadHistory() {
    if (historyLoaded) {
      setShowHistory(p => !p)
      return
    }
    if (!user) {
      setHistory([])
      setShowHistory(true)
      return
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('image_analyses')
        .select('id, image_path, analysis_result, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (fetchErr) {
        console.warn('Failed to load analysis history:', fetchErr.message)
      } else if (data) {
        const mapped: HistoryItem[] = data.map((item: any) => {
          const res = (item.analysis_result && typeof item.analysis_result === 'object') ? item.analysis_result : {}
          return {
            id: item.id,
            image_name: item.image_path || 'Uploaded Image',
            condition_name: res.condition || 'Visual Assessment',
            confidence: typeof res.confidence === 'number' ? res.confidence : null,
            created_at: item.created_at,
          }
        })
        setHistory(mapped)
        setHistoryLoaded(true)
      }
      setShowHistory(true)
    } catch (err) {
      console.warn('Failed to load analysis history:', err)
      setShowHistory(true)
    }
  }

  const clarityColor = !result ? '#9333EA' : result.confidence >= 70 ? '#10b981' : result.confidence >= 40 ? '#f59e0b' : '#06b6d4'

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-secondary" />
          <h1 className="text-2xl font-black text-white">Medical Image Analysis</h1>
        </div>
        <p className="text-white/40 text-sm">Upload a skin condition or visual health photo for AI-powered educational visual evaluation.</p>
      </motion.div>

      {/* Educational Disclaimer */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/08 border border-amber-500/18">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-amber-300/80 text-xs leading-relaxed space-y-1">
          <p>
            <strong className="text-amber-300">Educational & Triage Notice:</strong> This analysis describes possible conditions and visual observations for educational purposes only.
          </p>
          <p>
            It is <strong>not a medical diagnosis</strong> and should never replace an evaluation by a qualified doctor or dermatologist. Never ignore or delay professional medical care based on AI observations.
          </p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Upload zone */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className={`drop-zone ${dragOver ? 'drag-over' : ''} cursor-pointer relative`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !preview && inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept={ALLOWED.join(',')} className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

            {preview ? (
              <div className="relative">
                <img src={preview} alt="Uploaded medical reference" className="w-full rounded-[18px] object-cover max-h-72" />
                <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); setError('') }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-500/90 transition-colors shadow-lg"
                  title="Remove image">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1">
                  <p className="text-white text-[10px] truncate max-w-[180px] font-medium">{file?.name}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">Drop image here or click to upload</p>
                  <p className="text-white/35 text-xs mt-1">JPG, PNG, WebP, GIF up to {MAX_MB}MB</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Skin condition', 'Rash / Allergy', 'Eczema / Psoriasis', 'Mole observation', 'Insect bite'].map(l => (
                    <span key={l} className="text-[10px] bg-white/06 border border-white/09 rounded-full px-2.5 py-1 text-white/45">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Context input */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-white/55 mb-1.5">
              Symptoms & context <span className="text-white/30">(optional, improves assessment)</span>
            </label>
            <textarea value={context} onChange={e => setContext(e.target.value)}
              placeholder="e.g. 'Itchy red patch on forearm for 4 days, worsens after showering', 'New spot noticed 2 weeks ago'…"
              rows={3} className="input-dark resize-none text-xs" />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 mt-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block font-semibold">Analysis Request Failed</strong>
                {error}
              </div>
            </motion.div>
          )}

          <button onClick={analyze} disabled={!file || analyzing}
            className="btn-gradient w-full py-3 mt-3 text-sm disabled:opacity-40">
            {analyzing ? <Spinner size={16} className="text-white" /> : <Brain className="w-4 h-4" />}
            {analyzing ? 'Analysing with Gemini Vision…' : 'Analyse Image'}
          </button>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-card p-8 flex flex-col items-center justify-center gap-4 h-full min-h-[300px]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary animate-ping opacity-20" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">Analysing your image…</p>
                  <p className="text-white/40 text-xs mt-1">Inspecting visual features and color distribution</p>
                </div>
                {[0, 0.3, 0.6].map((d, i) => (
                  <motion.div key={i} className="w-32 h-1.5 rounded-full bg-white/08 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.2, delay: d, repeat: Infinity, ease: 'easeInOut' }} />
                  </motion.div>
                ))}
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 space-y-4">
                {/* Condition + visual clarity */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Possible Condition</p>
                      <h3 className="text-white font-black text-xl leading-tight">{result.condition}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="mb-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/50 text-[11px]">Visual Feature Clarity</span>
                      <span className="font-bold text-[11px]" style={{ color: clarityColor }}>
                        {result.confidence >= 70 ? 'High Clarity' : result.confidence >= 40 ? 'Moderate Clarity' : 'Low Clarity'} ({result.confidence}%)
                      </span>
                    </div>
                    <ClarityBar value={result.confidence} color={clarityColor} />
                    <p className="text-white/30 text-[9px] mt-1">Reflects how distinctly visual signs appear in the image, not a diagnostic probability.</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" /> Visual Observations
                  </p>
                  <p className="text-white/85 text-xs leading-relaxed">{result.description}</p>
                </div>

                {/* Causes */}
                {result.causes?.length > 0 && (
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Possible Triggers / Causes
                    </p>
                    <ul className="space-y-1">
                      {result.causes.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 flex-shrink-0" />
                          <p className="text-white/70 text-xs">{c}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3" /> Evidence-Based Recommendations
                    </p>
                    <ul className="space-y-1">
                      {result.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <p className="text-white/70 text-xs">{r}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Doctor advice */}
                <div className="p-3.5 rounded-xl bg-primary/08 border border-primary/20">
                  <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                    <Stethoscope className="w-3.5 h-3.5 text-secondary" /> Medical Consultation Guidance
                  </p>
                  <p className="text-white/80 text-xs leading-relaxed">{result.doctorAdvice}</p>
                </div>

                {/* Educational disclaimer */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/06 text-white/35 text-[10px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span>Educational visual assessment only — not a clinical medical diagnosis.</span>
                </div>

                {/* Recommended Dermatologists */}
                <div className="pt-2">
                  <DoctorRecommendations
                    groups={getRecommendedProvidersForImageAnalysis(result.condition).groups}
                    hasConcerningRisks={true}
                    summaryMessage={getRecommendedProvidersForImageAnalysis(result.condition).summaryMessage}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card p-8 flex flex-col items-center justify-center gap-4 min-h-[300px] text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/04 border border-white/08 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-white/20" />
                </div>
                <div>
                  <p className="text-white/40 font-medium text-sm">Visual analysis results will appear here</p>
                  <p className="text-white/25 text-xs mt-1">Upload a clear photo and click Analyse Image</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Analysis history */}
      <div className="glass-card overflow-hidden">
        <button onClick={loadHistory}
          className="w-full flex items-center justify-between p-5 hover:bg-white/02 transition-colors">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-white font-bold text-sm">Previous Analyses</h3>
          </div>
          {showHistory ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/06">
              {!user ? (
                <div className="p-6 text-center text-xs text-white/40">
                  Please sign in to view and save your previous image analyses.
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ImageIcon className="w-8 h-8 text-white/15" />
                  <p className="text-white/35 text-sm">No analyses recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/04">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/02 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/75 text-sm font-medium truncate">{h.condition_name ?? 'Visual Observation'}</p>
                        <p className="text-white/35 text-xs truncate">{h.image_name ?? 'Image'}</p>
                      </div>
                      {h.confidence != null && (
                        <span className="text-xs font-bold text-white/50">{h.confidence}%</span>
                      )}
                      <span className="text-white/30 text-xs flex-shrink-0">
                        {new Date(h.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
