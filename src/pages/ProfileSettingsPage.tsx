import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, Mail, Save, CheckCircle2, AlertCircle, Settings } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

export { SettingsPage } from './SettingsPage'

export function ProfilePage() {
  const { user, profile, displayName, initials, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!user) return
    setSaving(true)
    setErr('')
    setOk(false)
    const trimmed = name.trim()
    const { error } = await supabase.from('profiles').update({ full_name: trimmed }).eq('id', user.id)
    if (error) {
      setErr(error.message)
    } else {
      await supabase.auth.updateUser({ data: { full_name: trimmed } })
      await refreshProfile()
      setOk(true)
      setTimeout(() => setOk(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="p-5 max-w-xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <User className="w-5 h-5 text-secondary" />
          <h1 className="text-2xl font-black text-white">Profile</h1>
        </div>
        <p className="text-white/40 text-sm">Manage your account information and display identity.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="glass-card p-7 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
            <span className="text-white font-black text-xl">{initials}</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg">{displayName || name || 'My Account'}</p>
            <p className="text-white/40 text-sm">{user?.email}</p>
          </div>
        </div>

        {ok && <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Profile updated successfully!</div>}
        {err && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400"><AlertCircle className="w-4 h-4" /> {err}</div>}

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input className="input-dark pl-10" type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input className="input-dark pl-10" type="email" value={user?.email ?? ''} disabled />
          </div>
          <p className="text-[11px] text-white/35 mt-1">Managed via authentication provider.</p>
        </div>

        <button onClick={save} disabled={saving} className="btn-gradient w-full py-3">
          {saving ? <Spinner size={16} className="text-white" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

        <div className="pt-2 border-t border-white/06 text-center">
          <Link to="/settings" className="text-xs text-secondary hover:text-white transition-colors inline-flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            <span>Open All Application Settings &amp; Preferences</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
