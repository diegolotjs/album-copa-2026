import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase, cloudEnabled } from '../lib/supabase'
import { setAccessToken, stopSync } from '../lib/sync'

interface AuthStore {
  session: Session | null
  /** true quando já sabemos se há sessão ou não */
  ready: boolean
  /** envia o código OTP de 6 dígitos por e-mail */
  sendCode(email: string): Promise<{ error?: string }>
  /** verifica o código digitado; a sessão entra via onAuthStateChange */
  verifyCode(email: string, token: string): Promise<{ error?: string }>
  signOut(): Promise<void>
}

/** Traduz os erros comuns do Supabase Auth para mensagens claras. */
function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('expired') || m.includes('invalid') || m.includes('not found')) {
    return 'Código errado ou expirado. Confira os 6 dígitos ou toque em "Reenviar código".'
  }
  if (m.includes('security purposes') || m.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.'
  }
  if (m.includes('fetch') || m.includes('network')) {
    return 'Sem conexão. Verifique a internet e tente de novo.'
  }
  return message
}

export const useAuth = create<AuthStore>(() => ({
  session: null,
  ready: !cloudEnabled,

  async sendCode(email: string) {
    if (!supabase) return { error: 'Nuvem não configurada.' }
    // Sem emailRedirectTo: o fluxo do app é o CÓDIGO, não o link.
    const { error } = await supabase.auth.signInWithOtp({ email })
    return error ? { error: friendlyError(error.message) } : {}
  },

  async verifyCode(email: string, token: string) {
    if (!supabase) return { error: 'Nuvem não configurada.' }
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    return error ? { error: friendlyError(error.message) } : {}
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
