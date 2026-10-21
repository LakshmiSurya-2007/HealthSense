import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  User, Mail, Save, CheckCircle2, AlertCircle,
  Palette, Bell, Shield, LogOut, FileText,
  Brain, Lightbulb, Moon, Sparkles,
  Info, ShieldCheck, KeyRound, Clock
} from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

type ThemeOption = 'midnight' | 'obsidian' | 'high-contrast'
type MotionOption = 'smooth' | 'reduced'

export function SettingsPage() {
  const { user, profile, displayName, initials, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()

  // ── Profile / Account State ──
  const [name, setName] = useState(profile?.full_name || (displayName !== 'My Account' ? displayName : ''))
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name)
    } else if (displayName && displayName !== 'My Account') {
      setName(displayName)
    }
  }, [profile?.full_name, displayName])

  // ── Appearance State ──
  const [theme, setTheme] = useState<ThemeOption>(() => {
    try {
      return (localStorage.getItem('healthsense_theme') as ThemeOption) || 'midnight'
    } catch {
      return 'midnight'
    }
  })
  const [motionPref, setMotionPref] = useState<MotionOption>(() => {
    try {
      return (localStorage.getItem('healthsense_motion') as MotionOption) || 'smooth'
    } catch {
      return 'smooth'
    }
  })

  // ── Notification State ──
  const [inAppAlerts, setInAppAlerts] = useState<boolean>(() => {
    try {
      return localStorage.getItem('healthsense_pref_inapp_alerts') !== 'false'
    } catch {
      return true
    }
  })
  const [assessmentReminders, setAssessmentReminders] = useState<boolean>(() => {
    try {
      return localStorage.getItem('healthsense_pref_assessment_reminders') !== 'false'
    } catch {
      return true
    }
  })
  const [notifSaved, setNotifSaved] = useState(false)

  // ── Sign Out Modal State ──
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // ── Handlers: Profile Save ──
  async function handleSaveProfile(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!user) return

    setSavingProfile(true)
    setProfileError('')
    setProfileSuccess(false)

    try {
      const trimmedName = name.trim()

      // 1. Update public.profiles record
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: trimmedName })
        .eq('id', user.id)

      if (profileErr) throw profileErr

      // 2. Also keep user metadata in sync
      await supabase.auth.updateUser({
        data: { full_name: trimmedName }
      })

      await refreshProfile()
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 4000)
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Handlers: Theme Change ──
  function handleThemeChange(newTheme: ThemeOption) {
    setTheme(newTheme)
    try {
      localStorage.setItem('healthsense_theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    } catch {
      // localStorage fallback
    }
  }

  // ── Handlers: Motion Change ──
  function handleMotionChange(newMotion: MotionOption) {
    setMotionPref(newMotion)
    try {
      localStorage.setItem('healthsense_motion', newMotion)
      document.documentElement.setAttribute('data-motion', newMotion)
    } catch {
      // localStorage fallback
    }
  }

  // ── Handlers: Notifications Save ──
  function handleSaveNotifications() {
    try {
      localStorage.setItem('healthsense_pref_inapp_alerts', String(inAppAlerts))
      localStorage.setItem('healthsense_pref_assessment_reminders', String(assessmentReminders))
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 3000)
    } catch {
      // localStorage fallback
    }
  }

  // ── Handlers: Sign Out ──
  async function handleConfirmSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      setShowSignOutModal(false)
      navigate('/login')
    } catch (err) {
      console.error('Sign out error:', err)
      setSigningOut(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-white/50 text-xs sm:text-sm">
          Manage your account profile, visual appearance, notification preferences, privacy, and security.
        </p>
      </motion.div>

      {/* 1. Profile and Account Section */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6 sm:p-7 space-y-6"
        id="profile-settings"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-white/06">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
            <User className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Profile &amp; Account</h2>
            <p className="text-white/40 text-xs">Update your personal information and view account credentials.</p>
          </div>
        </div>

        {/* User Card Summary */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white/03 border border-white/06">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon flex-shrink-0">
            <span className="text-white font-black text-xl">
              {initials}
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-white font-bold text-base sm:text-lg truncate">{displayName || name || 'My Account'}</p>
            <p className="text-white/50 text-xs truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-white/40" />
              {user?.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/05 text-white/50 border border-white/08">
                <KeyRound className="w-3 h-3 text-secondary" />
                ID: {user?.id ? `${user.id.slice(0, 8)}…` : '—'}
              </span>
              {user?.created_at && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/05 text-white/40">
                  <Clock className="w-3 h-3 text-white/30" />
                  Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        <AnimatePresence>
          {profileSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3.5 text-sm text-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Profile updated successfully! Your display name has been saved.</span>
            </motion.div>
          )}
          {profileError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl p-3.5 text-sm text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{profileError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editable Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Full Name (Display Name)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="input-dark pl-10"
                />
              </div>
              <p className="text-[11px] text-white/35 mt-1">This name will appear on your health assessments and report headers.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-dark pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-white/35 mt-1">Managed via your Supabase authentication account.</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile || name.trim() === (profile?.full_name || '')}
              className="btn-gradient px-6 py-2.5 text-xs font-bold"
            >
              {savingProfile ? <Spinner size={14} className="text-white" /> : <Save className="w-4 h-4" />}
              <span>{savingProfile ? 'Saving Changes…' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </motion.section>

      {/* 2. Appearance Section */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 sm:p-7 space-y-6"
        id="appearance-settings"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-white/06">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Palette className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Appearance &amp; Theme</h2>
            <p className="text-white/40 text-xs">Customize the interface theme and visual motion preferences.</p>
          </div>
        </div>

        {/* Theme Preference Options */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
            Interface Theme Palette
          </label>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                id: 'midnight' as ThemeOption,
                name: 'Midnight Neon',
                tag: 'Default',
                desc: 'Vibrant violet-purple glow with neon magenta highlights.',
                border: 'border-primary/50',
                previewBg: 'bg-[#0D0221]',
              },
              {
                id: 'obsidian' as ThemeOption,
                name: 'Deep Obsidian',
                tag: 'OLED Dark',
                desc: 'Pure deep black canvas optimized for low-light clinical reading.',
                border: 'border-purple-900/60',
                previewBg: 'bg-[#050010]',
              },
              {
                id: 'high-contrast' as ThemeOption,
                name: 'High Contrast Dark',
                tag: 'High Legibility',
                desc: 'Sharpened card borders and boosted white text luminance.',
                border: 'border-white/30',
                previewBg: 'bg-[#070014]',
              },
            ].map(t => {
              const active = theme === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleThemeChange(t.id)}
                  className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-3 ${
                    active
                      ? `${t.border} bg-white/08 shadow-neon ring-1 ring-secondary/50`
                      : 'border-white/07 bg-white/02 hover:border-white/20 hover:bg-white/04'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white font-bold text-sm flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-secondary" />
                      {t.name}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      active ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-white/05 text-white/40'
                    }`}>
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-white/45 text-xs leading-relaxed">{t.desc}</p>
                  <div className="w-full h-2 rounded-full overflow-hidden flex gap-1 pt-0.5">
                    <div className="flex-1 rounded-full bg-primary" />
                    <div className="flex-1 rounded-full bg-secondary" />
                    <div className="flex-1 rounded-full bg-purple-800" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Motion / Animation Preference */}
        <div className="pt-2 border-t border-white/06 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-md">
            <p className="text-white text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-secondary" />
              User Interface Motion &amp; Animations
            </p>
            <p className="text-white/40 text-xs">
              Controls pulse glowing and continuous animations throughout predictive charts and dashboards.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/04 p-1 rounded-xl border border-white/07">
            <button
              type="button"
              onClick={() => handleMotionChange('smooth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                motionPref === 'smooth' ? 'bg-primary text-white shadow-neon' : 'text-white/50 hover:text-white'
              }`}
            >
              Smooth Motion
            </button>
            <button
              type="button"
              onClick={() => handleMotionChange('reduced')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                motionPref === 'reduced' ? 'bg-secondary text-white shadow-neon' : 'text-white/50 hover:text-white'
              }`}
            >
              Reduced Motion
            </button>
          </div>
        </div>

        {/* Theme Architecture Note */}
        <div className="p-3.5 rounded-xl bg-white/02 border border-white/05 text-xs text-white/45 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-white/60">Design Note:</strong> HealthSense AI utilizes an optimized dark glassmorphism design system to protect clinical visualization contrast. Selected theme variations are applied immediately and persisted in your browser across sessions.
          </p>
        </div>
      </motion.section>

      {/* 3. Notifications Section */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6 sm:p-7 space-y-6"
        id="notification-settings"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-white/06">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bell className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Notifications &amp; Alerts</h2>
            <p className="text-white/40 text-xs">Configure in-app health risk alerts and review external delivery channels.</p>
          </div>
        </div>

        {/* Functional in-app settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/03 border border-white/06">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold">In-App Health Risk Alerts</p>
                <span className="badge-low text-[9px]">Active</span>
              </div>
              <p className="text-white/40 text-xs">
                Display alert notices when a new risk assessment detects elevated glycemic, arterial, or renal metrics.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInAppAlerts(!inAppAlerts)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 focus:outline-none ${
                inAppAlerts ? 'bg-primary' : 'bg-white/15'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  inAppAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/03 border border-white/06">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold">Assessment Follow-Up Reminders</p>
                <span className="badge-low text-[9px]">Active</span>
              </div>
              <p className="text-white/40 text-xs">
                Suggest dashboard prompts to retake health check assessments and update biometric measurements periodically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAssessmentReminders(!assessmentReminders)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 focus:outline-none ${
                assessmentReminders ? 'bg-primary' : 'bg-white/15'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  assessmentReminders ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* External services status (unconfigured / requires gateway) */}
        <div className="space-y-3 pt-2 border-t border-white/06">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">External Delivery Channels</p>

          <div className="p-3.5 rounded-xl bg-white/02 border border-white/05 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-white/80 text-sm font-medium">Email Report Summaries</p>
              <p className="text-white/40 text-xs">
                Direct email dispatch requires configuring an external SMTP provider (such as Resend, SendGrid, or AWS SES).
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Requires SMTP Integration
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/02 border border-white/05 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-white/80 text-sm font-medium">Browser Push &amp; SMS Reminders</p>
              <p className="text-white/40 text-xs">
                Web push delivery requires a registered Service Worker and VAPID key backend integration.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Requires VAPID / SMS Gateway
            </span>
          </div>
        </div>

        {/* Save Notification Preferences button */}
        <div className="pt-2 flex items-center justify-between">
          <AnimatePresence>
            {notifSaved && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-emerald-400 text-xs font-semibold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Notification preferences saved!
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleSaveNotifications}
            className="btn-secondary px-5 py-2 text-xs font-bold ml-auto"
          >
            Save Notification Preferences
          </button>
        </div>
      </motion.section>

      {/* 4. Privacy and Data Section */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 sm:p-7 space-y-6"
        id="privacy-settings"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-white/06">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Privacy &amp; Health Data</h2>
            <p className="text-white/40 text-xs">Review data isolation policies and access your stored health assessments.</p>
          </div>
        </div>

        {/* Row Level Security info banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/08 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-emerald-300 text-sm font-bold">Account Data Isolation &amp; Row Level Security (RLS)</h3>
          </div>
          <p className="text-white/70 text-xs leading-relaxed">
            All biometrics, health assessments, AI risk predictions, medical image analyses, and chat assistant records are cryptographically associated with your unique account ID (<code className="text-secondary font-mono">{user?.id}</code>). Supabase Row Level Security guarantees that no other user can view or query your health records.
          </p>
        </div>

        {/* Quick Data Navigation */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Manage Health Records</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link
              to="/reports"
              className="p-3.5 rounded-xl bg-white/03 hover:bg-white/08 border border-white/07 hover:border-primary/40 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4 text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-bold truncate">Health Reports</p>
                <p className="text-white/40 text-[10px]">View all saved reports</p>
              </div>
            </Link>

            <Link
              to="/predict"
              className="p-3.5 rounded-xl bg-white/03 hover:bg-white/08 border border-white/07 hover:border-primary/40 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                <Brain className="w-4 h-4 text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-bold truncate">New Assessment</p>
                <p className="text-white/40 text-[10px]">Calculate health risks</p>
              </div>
            </Link>

            <Link
              to="/suggestions"
              className="p-3.5 rounded-xl bg-white/03 hover:bg-white/08 border border-white/07 hover:border-primary/40 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-bold truncate">Care Suggestions</p>
                <p className="text-white/40 text-[10px]">Lifestyle &amp; diet plan</p>
              </div>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 5. Security and Session Section */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-6 sm:p-7 space-y-6 border-red-500/20"
        id="security-settings"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-white/06">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Security &amp; Session</h2>
            <p className="text-white/40 text-xs">Manage your active authentication session or sign out safely.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/02 border border-white/06">
          <div className="space-y-1">
            <p className="text-white text-sm font-semibold">Active Supabase Session</p>
            <p className="text-white/45 text-xs">
              Signed in as <span className="text-white/80 font-medium">{user?.email}</span>
            </p>
            {user?.last_sign_in_at && (
              <p className="text-white/35 text-[11px]">
                Session authenticated at {new Date(user.last_sign_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.section>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 sm:p-7 max-w-md w-full border border-red-500/30 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Sign Out of HealthSense AI?</h3>
                  <p className="text-white/40 text-xs">Confirm your session termination.</p>
                </div>
              </div>

              <p className="text-white/70 text-xs leading-relaxed">
                Are you sure you want to sign out? Your saved health reports and assessment history will remain safely stored under your account for your next login.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignOutModal(false)}
                  disabled={signingOut}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignOut}
                  disabled={signingOut}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/30"
                >
                  {signingOut ? <Spinner size={14} className="text-white" /> : <LogOut className="w-3.5 h-3.5" />}
                  <span>{signingOut ? 'Signing out…' : 'Yes, Sign Out'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
