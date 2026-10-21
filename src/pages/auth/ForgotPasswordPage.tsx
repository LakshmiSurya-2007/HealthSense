import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/Spinner'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login' })
    if (error) setErr(error.message); else setOk(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg bg-mesh flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl"><span className="gradient-text">HealthSense</span><span className="text-white/80 ml-1">AI</span></span>
        </Link>

        <div className="glass rounded-3xl p-8">
          {ok ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Check your email</h2>
              <p className="text-white/60 text-sm mb-6">We've sent a password reset link to <strong className="text-white">{email}</strong></p>
              <Link to="/login" className="btn-primary w-full py-3 block text-center">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-black text-white">Reset password</h1>
                <p className="text-white/50 text-sm mt-1">Enter your email and we'll send you a reset link</p>
              </div>
              {err && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
                </div>
              )}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input className="input-dark pl-10" type="email" required placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-gradient w-full py-3 mt-2">
                  {loading ? <Spinner size={18} className="text-white" /> : <Mail className="w-4 h-4" />}
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/login" className="text-primary hover:text-secondary text-sm font-semibold transition-colors">← Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
