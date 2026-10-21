import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

export function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    if (!name.trim()) { setErr('Full name is required'); return }
    if (pw.length < 6) { setErr('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await signUp(email, pw, name)
    if (error) { setErr(error.message); setLoading(false) }
    else { setOk(true); setTimeout(() => navigate('/dashboard'), 2000) }
  }

  if (ok) return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Account Created!</h2>
        <p className="text-white/60">Redirecting to your dashboard…</p>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg bg-mesh flex items-center justify-center px-4 py-10">
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl"><span className="gradient-text">HealthSense</span><span className="text-white/80 ml-1">AI</span></span>
        </Link>

        <div className="glass rounded-3xl p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-black text-white">Create your account</h1>
            <p className="text-white/50 text-sm mt-1">Start your AI health journey — it's completely free</p>
          </div>

          {err && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
            </motion.div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input className="input-dark pl-10" type="text" required placeholder="Dr. Jane Smith"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input className="input-dark pl-10" type="email" required placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input className="input-dark pl-10 pr-10" type={show ? 'text' : 'password'} required placeholder="Min. 6 characters"
                  value={pw} onChange={e => setPw(e.target.value)} />
                <button type="button" onClick={() => setShow(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gradient w-full py-3 mt-2">
              {loading ? <Spinner size={18} className="text-white" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Creating account…' : 'Create Free Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-secondary font-semibold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
