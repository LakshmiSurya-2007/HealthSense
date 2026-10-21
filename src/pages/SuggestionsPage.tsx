import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  Apple, Dumbbell, Moon, Brain, Droplets,
  Scale, Heart, CheckCircle2, TrendingUp, Sparkles,
  Zap, Clock, AlertCircle,
} from 'lucide-react'

interface Pred { diabetes_risk: number; heart_risk: number; kidney_risk: number; hypertension_risk: number; health_score: number; risk_level: string; recommendations: string[] }

interface SugItem { title: string; desc: string; priority: 'high' | 'medium' | 'low' }

const DIET_BASE: SugItem[] = [
  { title: 'Reduce added sugar', desc: 'Limit added sugars to <25g/day (women) or <36g/day (men). Swap sugary drinks for water, herbal tea, or sparkling water.', priority: 'high' },
  { title: 'Increase dietary fibre', desc: 'Aim for 25–35g of fibre daily from vegetables, legumes, whole grains, and fruits. Fibre slows glucose absorption and feeds beneficial gut bacteria.', priority: 'high' },
  { title: 'Choose healthy fats', desc: 'Replace saturated fats (red meat, butter) with unsaturated fats from olive oil, avocado, nuts, and fatty fish. Avoid trans fats entirely.', priority: 'medium' },
  { title: 'Follow the DASH or Mediterranean diet', desc: 'Both diets are strongly evidence-based for reducing blood pressure, cholesterol, and diabetes risk. Emphasise vegetables, fruits, legumes, whole grains, and fish.', priority: 'medium' },
  { title: 'Reduce sodium intake', desc: 'Keep sodium below 2,300mg/day (ideally 1,500mg for those with hypertension). Avoid processed foods and restaurant meals where possible.', priority: 'medium' },
  { title: 'Eat more oily fish', desc: 'Aim for 2+ servings of oily fish (salmon, mackerel, sardines) per week for omega-3 fatty acids that protect heart and brain health.', priority: 'low' },
]

const EXERCISE_BASE: SugItem[] = [
  { title: '150 minutes moderate aerobic exercise', desc: 'This is the WHO minimum: brisk walking, cycling, swimming, or dancing for 150 min/week. Even three 10-minute walks/day counts.', priority: 'high' },
  { title: 'Strength training twice a week', desc: 'Resistance exercise (weights, resistance bands, bodyweight) improves insulin sensitivity, bone density, and metabolic rate.', priority: 'medium' },
  { title: 'Reduce prolonged sitting', desc: 'Break up sitting every 30–60 minutes with a 5-minute walk or stretch. Prolonged sitting independently raises cardiovascular risk regardless of exercise habits.', priority: 'medium' },
  { title: 'Post-meal walking', desc: 'A 10–15 minute walk after meals significantly blunts blood glucose spikes and improves insulin sensitivity over time.', priority: 'high' },
  { title: 'Flexibility and balance training', desc: 'Yoga, Pilates, or stretching 2–3x/week improves flexibility, reduces injury risk, and has measurable stress-reducing effects.', priority: 'low' },
]

const SLEEP_BASE: SugItem[] = [
  { title: 'Maintain a consistent sleep schedule', desc: 'Go to bed and wake up at the same time every day, including weekends. Irregular sleep timing disrupts circadian rhythms and metabolic health.', priority: 'high' },
  { title: 'Create an optimal sleep environment', desc: 'Keep your bedroom cool (16–19°C), dark, and quiet. Use blackout curtains and consider white noise if needed.', priority: 'medium' },
  { title: 'Limit screen exposure before bed', desc: 'Avoid screens (phones, tablets, TV) for at least 60 minutes before sleep. Blue light suppresses melatonin and delays sleep onset.', priority: 'high' },
  { title: 'Avoid caffeine after 2pm', desc: 'Caffeine has a half-life of 5–6 hours. Consuming it in the afternoon can significantly delay sleep onset even if you feel alert.', priority: 'medium' },
  { title: 'Establish a relaxing bedtime routine', desc: 'Reading, gentle stretching, warm baths, or mindfulness meditation 20–30 min before bed signals your body to wind down.', priority: 'low' },
]

const STRESS_BASE: SugItem[] = [
  { title: 'Daily mindfulness or meditation', desc: 'Even 10 minutes of mindfulness meditation daily has been shown to reduce cortisol, blood pressure, and anxiety in clinical trials.', priority: 'high' },
  { title: 'Regular aerobic exercise for stress', desc: 'Aerobic exercise is one of the most effective stress reducers available. A 30-minute session can reduce cortisol for up to 2 hours afterward.', priority: 'high' },
  { title: 'Cultivate social connections', desc: 'Strong social relationships are a powerful buffer against stress and one of the most consistent predictors of longevity in research literature.', priority: 'medium' },
  { title: 'Practice time management', desc: 'Break overwhelming tasks into smaller steps. Use techniques like time-blocking or the Pomodoro method to manage workload stress.', priority: 'medium' },
  { title: 'Consider professional support', desc: 'Cognitive Behavioural Therapy (CBT) is the most evidence-based treatment for chronic stress, anxiety, and depression. Seeking support is a sign of strength.', priority: 'low' },
]

const HYDRATION_BASE: SugItem[] = [
  { title: 'Drink 2–3 litres of water daily', desc: 'Most adults need 8–10 glasses of water per day. Adequate hydration supports kidney function, metabolism, skin health, and cognitive performance.', priority: 'high' },
  { title: 'Drink water before meals', desc: 'Drinking a glass of water 20–30 minutes before eating can reduce calorie intake and improve digestion.', priority: 'medium' },
  { title: 'Limit sugary drinks', desc: 'Replace soda, juice, and energy drinks with water, sparkling water, or herbal tea. Liquid calories significantly contribute to excess weight and insulin resistance.', priority: 'high' },
  { title: 'Limit alcohol consumption', desc: 'Alcohol dehydrates, raises blood pressure, and damages the liver and kidneys. Limit to ≤14 units/week (UK guidelines) with alcohol-free days.', priority: 'medium' },
]

const WEIGHT_BASE: SugItem[] = [
  { title: 'Set a realistic weight goal', desc: 'Even a 5–10% reduction in body weight has significant health benefits. Focus on sustainable changes rather than rapid loss.', priority: 'high' },
  { title: 'Track food intake', desc: 'Using a food diary or app (even for 2–4 weeks) significantly increases awareness of eating patterns and is associated with better weight management outcomes.', priority: 'medium' },
  { title: 'Prioritise protein at each meal', desc: 'Adequate protein (25–30% of calories) preserves muscle mass during weight loss, increases satiety, and has a higher thermic effect than carbs or fat.', priority: 'medium' },
  { title: 'Cook at home more often', desc: 'Home-cooked meals average 500 fewer calories than restaurant meals. Batch cooking on weekends makes healthy eating easier during the week.', priority: 'low' },
]

const SECTIONS = [
  { id: 'diet',      label: 'Diet & Nutrition',   icon: Apple,    color: '#10b981', items: DIET_BASE },
  { id: 'exercise',  label: 'Exercise & Fitness',  icon: Dumbbell, color: '#9333EA', items: EXERCISE_BASE },
  { id: 'sleep',     label: 'Sleep Optimisation',  icon: Moon,     color: '#06b6d4', items: SLEEP_BASE },
  { id: 'stress',    label: 'Stress Management',   icon: Brain,    color: '#FF4FCB', items: STRESS_BASE },
  { id: 'hydration', label: 'Hydration',            icon: Droplets, color: '#3b82f6', items: HYDRATION_BASE },
  { id: 'weight',    label: 'Weight Management',   icon: Scale,    color: '#f59e0b', items: WEIGHT_BASE },
] as const

const PRIORITY_CONFIG = {
  high:   { label: 'High Priority', bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400' },
  medium: { label: 'Medium',         bg: 'bg-amber-500/10',  border: 'border-amber-500/20',   text: 'text-amber-400' },
  low:    { label: 'Maintenance',    bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
}

export function SuggestionsPage() {
  const { user, displayName } = useAuth()
  const [pred, setPred] = useState<Pred | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('all')

  useEffect(() => {
    if (!user) return
    supabase.from('predictions').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { setPred(data); setLoading(false) })
  }, [user])

  // Boost priority of sections based on risk
  function getItems(sectionId: string, base: SugItem[]): SugItem[] {
    if (!pred) return base
    const boostMap: Record<string, boolean> = {
      diet:      pred.diabetes_risk > 40 || pred.hypertension_risk > 40,
      exercise:  pred.heart_risk > 30 || pred.hypertension_risk > 30,
      hydration: pred.kidney_risk > 30,
      weight:    pred.diabetes_risk > 30 || pred.heart_risk > 30,
    }
    if (!boostMap[sectionId]) return base
    return base.map(item => ({ ...item, priority: item.priority === 'low' ? 'medium' : item.priority === 'medium' ? 'high' : 'high' }))
  }

  const highCount = SECTIONS.reduce((acc, s) => acc + getItems(s.id, [...s.items]).filter(i => i.priority === 'high').length, 0)

  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h1 className="text-2xl font-black text-white">Health Suggestions</h1>
        </div>
        <p className="text-white/40 text-sm">
          Personalised recommendations based on {displayName && displayName !== 'My Account' ? `${displayName}’s` : 'your'} latest health assessment.
        </p>
      </motion.div>

      {/* Summary cards */}
      {pred && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Health Score', value: `${pred.health_score}/100`, icon: TrendingUp, color: '#9333EA' },
            { label: 'High Priority Tips', value: highCount, icon: AlertCircle, color: '#ef4444' },
            { label: 'Total Suggestions', value: SECTIONS.reduce((a,s) => a + s.items.length, 0), icon: Zap, color: '#FF4FCB' },
            { label: 'Risk Level', value: pred.risk_level.charAt(0).toUpperCase() + pred.risk_level.slice(1), icon: Heart, color: '#10b981' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: s.color + '22' }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {!pred && !loading && (
        <div className="glass-card p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-white/60 text-sm">No health assessment found. Complete a <a href="/predict" className="text-primary hover:underline">health prediction</a> first to get fully personalised suggestions.</p>
        </div>
      )}

      {/* Section filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeSection === 'all' ? 'bg-primary text-white' : 'bg-white/05 text-white/55 hover:text-white'}`}>
          All Sections
        </button>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeSection === s.id ? 'text-white' : 'bg-white/05 text-white/55 hover:text-white'}`}
            style={activeSection === s.id ? { background: s.color, boxShadow: `0 0 12px ${s.color}55` } : {}}>
            <s.icon className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      {SECTIONS.filter(s => activeSection === 'all' || activeSection === s.id).map((section, si) => {
        const items = getItems(section.id, [...section.items])
        return (
          <motion.div key={section.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.06 }} className="glass-card overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 p-5 border-b border-white/06"
              style={{ background: section.color + '08' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: section.color + '20' }}>
                <section.icon className="w-5 h-5" style={{ color: section.color }} />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm">{section.label}</h2>
                <p className="text-white/40 text-xs">{items.length} recommendations</p>
              </div>
              <div className="ml-auto text-xs font-bold" style={{ color: section.color }}>
                {items.filter(i => i.priority === 'high').length} high priority
              </div>
            </div>
            {/* Items */}
            <div className="p-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((item, ii) => {
                const pc = PRIORITY_CONFIG[item.priority]
                return (
                  <motion.div key={ii} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: si * 0.06 + ii * 0.04 }}
                    className="sug-card flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: section.color }} />
                        <p className="text-white text-sm font-semibold leading-snug">{item.title}</p>
                      </div>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
                    <div className="mt-auto pt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.border} ${pc.text}`}>
                        {pc.label}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )
      })}

      {/* Progress tracking note */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="glass-card p-5 border border-primary/15">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm mb-1">Track Your Progress</p>
            <p className="text-white/50 text-xs leading-relaxed">
              Re-run a health assessment after 4–8 weeks of consistently following these suggestions to see measurable improvements in your risk scores. Small, consistent changes add up significantly over time.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
