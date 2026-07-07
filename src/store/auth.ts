import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase, cloudEnabled } from '../lib/supabase'
import { setAccessToken, stopSync } from '../lib/sync'

interface AuthStore {
  session: Session | null
  /** true quando já sabemos se há sessão ou não */
  ready: boolean
  sendMagicLink(email: string): Promise<{ error?: string }>
  signOut(): Promise<void>
}

export const useAuth = create<AuthStore>(() => ({
  session: null,
  ready: !cloudEnabled,

  async sendMagicLink(email: string) {
    if (!supabase) return { error: 'Nuvem não configurada.' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return error ? { error: error.message } : {}
  },

  async signOut() {
    await supabase?.auth.signOut()
    stopSync()
  },
}))

export function initAuth(): void {
  if (!supabase) return
  void supabase.auth.getSession().then(({ data }) => {
    setAccessToken(data.session?.access_token ?? null)
    useAuth.setState({ session: data.session, ready: true })
  })
  supabase.auth.onAuthStateChange((_event, session) => {
    setAccessToken(session?.access_token ?? null)
    useAuth.setState({ session, ready: true })
  })
}
