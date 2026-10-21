import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
}

export interface AuthCtx {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  displayName: string
  firstName: string
  initials: string
  signIn: (email: string, pw: string) => Promise<{ error: Error | null }>
  signUp: (email: string, pw: string, name: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function formatEmailFallback(email?: string | null): string {
  if (!email) return ''
  const prefix = email.split('@')[0] || ''
  // Replace dots, underscores, hyphens with spaces
  const cleaned = prefix.replace(/[._\-+]/g, ' ').trim()
  if (!cleaned) return ''
  // Title-case each word
  return cleaned
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function computeUserDisplayName(user: User | null, profile: Profile | null): string {
  if (!user && !profile) return ''

  // 1. Authenticated user's profile name from profiles table (if saved & non-empty)
  if (profile?.full_name && profile.full_name.trim().length > 0) {
    return profile.full_name.trim()
  }

  // 2. Full name in auth provider's user metadata
  const meta = (user?.user_metadata || (user as any)?.raw_user_meta_data)
  const metaName = meta?.full_name || meta?.name
  if (metaName && typeof metaName === 'string' && metaName.trim().length > 0) {
    return metaName.trim()
  }

  // 3. Sensible fallback derived from email address
  const emailVal = user?.email || profile?.email
  const emailFallback = formatEmailFallback(emailVal)
  if (emailFallback) {
    return emailFallback
  }

  // 4. Fallback if no usable name can be obtained
  return 'My Account'
}

export function computeUserInitials(name: string): string {
  if (!name || name === 'My Account') return 'U'
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }
  return 'U'
}

async function loadProfile(uid: string) {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    return data as Profile | null
  } catch (err) {
    console.warn('Error fetching user profile:', err)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function initSession() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (!isMounted) return
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          const p = await loadProfile(s.user.id)
          if (isMounted) setProfile(p)
        } else {
          if (isMounted) setProfile(null)
        }
      } catch (err) {
        console.warn('Error initializing session:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, s) => {
      if (!isMounted) return
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const p = await loadProfile(s.user.id)
        if (isMounted) setProfile(p)
      } else {
        if (isMounted) setProfile(null)
      }
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } }
    })
    return { error }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const p = await loadProfile(user.id)
      setProfile(p)
    }
  }

  const displayName = useMemo(() => computeUserDisplayName(user, profile), [user, profile])

  const firstName = useMemo(() => {
    if (!displayName || displayName === 'My Account') return 'there'
    return displayName.split(' ')[0]
  }, [displayName])

  const initials = useMemo(() => computeUserInitials(displayName), [displayName])

  return (
    <Ctx.Provider value={{
      user,
      session,
      profile,
      loading,
      displayName,
      firstName,
      initials,
      signIn,
      signUp,
      signOut,
      refreshProfile
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be inside AuthProvider')
  return c
}
