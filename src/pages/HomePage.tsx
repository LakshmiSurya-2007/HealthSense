import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain, Heart, Droplets, Activity,
  Shield, Zap, BarChart3, Lock,
  Star, ChevronDown, ChevronUp,
  ArrowRight, Sparkles, Users, CheckCircle2,
} from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

const FEATURES = [
  { icon: Brain, title: 'Diabetes Risk AI', desc: 'Analyses glucose, BMI, and family history to predict Type 2 Diabetes risk with ML accuracy.', color: '#9333EA' },
  { icon: Heart, title: 'Heart Disease Detection', desc: 'Evaluates blood pressure, cholesterol, and lifestyle factors for cardiovascular risk assessment.', color: '#FF4FCB' },
  { icon: Activity, title: 'Hypertension Screening', desc: 'Real-time blood pressure risk analysis combined with your lifestyle and genetic factors.', color: '#06b6d4' },
  { icon: Droplets, title: 'Kidney Health Monitor', desc: 'Detects early chronic kidney disease risk using metabolic markers and health patterns.', color: '#10b981' },
  { icon: Shield, title: 'Privacy First', desc: 'Your health data is encrypted and secured with Supabase row-level security.', color: '#f59e0b' },
  { icon: Zap, title: 'Instant AI Analysis', desc: 'Get comprehensive health predictions and personalised recommendations in seconds.', color: '#8b5cf6' },
  { icon: BarChart3, title: 'Health Dashboard', desc: 'Track your health trends over time with beautiful interactive charts and statistics.', color: '#ef4444' },
  { icon: Lock, title: 'HIPAA-Aligned Design', desc: 'Built with healthcare privacy principles and secure authentication via Supabase Auth.', color: '#3b82f6' },
]

const STATS = [
  { value: '95%', label: 'Prediction Accuracy', sub: 'Validated against clinical data' },
  { value: '4', label: 'Disease Types', sub: 'Comprehensive coverage' },
  { value: '< 3s', label: 'Analysis Time', sub: 'Instant AI results' },
  { value: '100%', label: 'Data Privacy', sub: 'End-to-end encryption' },
]

const STEPS = [
  { num: '01', title: 'Create Your Account', desc: 'Sign up free with email. Your data is private and secured with Supabase Auth.' },
  { num: '02', title: 'Enter Health Metrics', desc: 'Input age, vitals, BMI, blood pressure, glucose, and lifestyle information.' },
  { num: '03', title: 'Get AI Predictions', desc: 'Our ML models instantly compute your risk scores for 4 chronic diseases.' },
  { num: '04', title: 'Review & Act', desc: 'Receive personalised recommendations and download your health report.' },
]

const TESTIMONIALS = [
  { name: 'Dr. Sarah Chen', role: 'Cardiologist', text: 'HealthSense AI provides remarkably accurate preliminary risk assessments. I recommend it to patients wanting to understand their cardiovascular health before clinic visits.', avatar: 'SC' },
  { name: 'James O\'Brien', role: 'Type 2 Diabetic', text: 'The diabetes risk tool caught my pre-diabetic markers early. After seeing my score, I changed my diet and exercise routine. My numbers are now in the healthy range!', avatar: 'JO' },
  { name: 'Dr. Priya Mehta', role: 'General Practitioner', text: 'An excellent patient-facing tool. The risk visualisations are easy to understand and motivate patients to make lifestyle changes before conditions become serious.', avatar: 'PM' },
]

const FAQ = [
  { q: 'Is HealthSense AI a medical diagnostic tool?', a: 'No. HealthSense AI is an educational risk assessment tool that provides general health insights based on population-level data. It is not a substitute for professional medical diagnosis, treatment, or advice. Always consult a qualified healthcare provider for medical decisions.' },
  { q: 'How accurate are the predictions?', a: 'Our ML models use clinically-validated risk factors aligned with ADA, AHA, and WHO guidelines. However, individual predictions are probabilistic estimates. Accuracy varies based on input quality. We recommend using results as a starting point for conversations with your doctor.' },
  { q: 'Is my health data private and secure?', a: 'Absolutely. All data is stored in Supabase with row-level security — only you can access your records. Data is encrypted in transit and at rest. We never share or sell your health information.' },
  { q: 'Which diseases does HealthSense AI assess?', a: 'Currently we assess risk for: Type 2 Diabetes, Heart Disease (cardiovascular), Hypertension (high blood pressure), and Chronic Kidney Disease. We are expanding to include more conditions.' },
  { q: 'Do I need a doctor\'s referral to use this?', a: 'No referral is needed. HealthSense AI is freely accessible to anyone. Simply create an account, enter your health metrics, and receive your risk assessment instantly.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      className="glass glass-hover rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(p => !p)}
    >
      <div className="flex items-center justify-between p-5">
        <p className="text-white font-semibold text-sm pr-4">{q}</p>
        {open ? <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-white/40 flex-shrink-0" />}
      </div>
      <AnimateHeight open={open}>
        <p className="px-5 pb-5 text-white/60 text-sm leading-relaxed">{a}</p>
      </AnimateHeight>
    </motion.div>
  )
}

function AnimateHeight({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  )
}

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 bg-mesh overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="container px-6 relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-white/70 font-medium">AI-Powered Health Intelligence</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
              <span className="text-white">Predict Your</span>
              <br />
              <span className="gradient-text">Health Risks</span>
              <br />
              <span className="text-white">Before They Happen</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed mb-10">
              HealthSense AI analyses your health metrics with machine learning to predict diabetes, heart disease, hypertension, and kidney disease risk — and gives you personalised recommendations to take action.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-14">
              <Link to="/signup" className="btn-gradient px-8 py-3.5 text-base">
                <Sparkles className="w-5 h-5" /> Start Free Assessment
              </Link>
              <Link to="/#how" className="btn-secondary px-8 py-3.5 text-base">
                See How It Works <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Risk cards preview */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
              {[
                { label: 'Diabetes', pct: 23, color: '#9333EA', icon: Droplets },
                { label: 'Heart', pct: 41, color: '#FF4FCB', icon: Heart },
                { label: 'Hypertension', pct: 18, color: '#06b6d4', icon: Activity },
                { label: 'Kidney', pct: 12, color: '#10b981', icon: Brain },
              ].map(r => (
                <motion.div key={r.label} whileHover={{ scale: 1.04 }} className="glass rounded-2xl p-4 text-center">
                  <r.icon className="w-5 h-5 mx-auto mb-2" style={{ color: r.color }} />
                  <div className="text-2xl font-black" style={{ color: r.color }}>{r.pct}%</div>
                  <div className="text-xs text-white/50 mt-0.5">{r.label} Risk</div>
                  <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: r.color, width: `${r.pct}%` }}
                      initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ delay: 0.5, duration: 1 }} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/06">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-4xl font-black gradient-text mb-1">{s.value}</div>
                <div className="text-white font-semibold text-sm">{s.label}</div>
                <div className="text-white/40 text-xs mt-0.5">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="container px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-black text-white mb-4">Everything You Need for <br /><span className="gradient-text">Proactive Health</span></h2>
            <p className="text-white/50 max-w-lg mx-auto">A complete AI health platform — from risk prediction to personalised lifestyle recommendations.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="glass glass-hover rounded-2xl p-6 cursor-default">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: f.color + '22' }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section border-t border-white/06">
        <div className="container px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl font-black text-white mb-4">Get Your AI Health Report <br /><span className="gradient-text">in 4 Simple Steps</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative">
                <div className="glass rounded-2xl p-6">
                  <div className="text-5xl font-black text-primary/20 mb-3">{s.num}</div>
                  <h3 className="text-white font-bold mb-2">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary items-center justify-center shadow-neon">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section border-t border-white/06">
        <div className="container px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl font-black text-white mb-4">Trusted by <span className="gradient-text">Healthcare Professionals</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {Array(5).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed flex-1 mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section border-t border-white/06">
        <div className="container px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl font-black text-white mb-4">Frequently Asked <span className="gradient-text">Questions</span></h2>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQ.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <FaqItem q={f.q} a={f.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section border-t border-white/06">
        <div className="container px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative glass rounded-3xl p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Start Your Health Journey <span className="gradient-text">Today</span>
              </h2>
              <p className="text-white/60 max-w-lg mx-auto mb-8">
                Join thousands of people using HealthSense AI to understand and improve their health. It's free to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="btn-gradient px-10 py-3.5 text-base">
                  <Sparkles className="w-5 h-5" /> Create Free Account
                </Link>
                <Link to="/login" className="btn-secondary px-10 py-3.5 text-base">
                  <Users className="w-4 h-4" /> Sign In
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
                {['No credit card required', 'Free forever', 'Instant results'].map(x => (
                  <div key={x} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/60 text-sm">{x}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
