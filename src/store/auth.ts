import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase, cloudEnabled } from '../lib/supabase'
import { setAccessToken, stopSync } from '../lib/sync'

interface AuthStore {
  session: Session | null
  /** true quando já sabemos se há sessão ou não */
  ready: boolean
  signIn(email: string, password: string): Promise<{ error?: string }>
  /** "Confirm email" está desativado no Supabase: signUp já retorna sessão */
  signUp(email: string, password: string): Promise<{ error?: string }>
  signOut(): Promise<void>
}

/** Traduz os erros comuns do Supabase Auth para mensagens claras. */
function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Confira e tente de novo.'
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Este e-mail já tem conta — toque em "Entrar" e use sua senha.'
  }
  if (m.includes('at least 6 characters') || m.includes('password should be')) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
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

  async signIn(email: string, password: string) {
    if (!supabase) return { error: 'Nuvem não configurada.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: friendlyError(error.message) } : {}
  },

  async signUp(email: string, password: string) {
    if (!supabase) return { error: 'Nuvem não configurada.' }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: friendlyError(error.message) }
    // Se o "Confirm email" for reativado no Supabase, signUp devolve user sem
    // sessão — avisa em vez de deixar a tela parada.
    if (!data.session) {
      return { error: 'Conta criada! Confirme pelo e-mail que enviamos e depois toque em "Entrar".' }
    }
    return {}
  },

  // "Esqueci a senha" entraria aqui: supabase.auth.resetPasswordForEmail(email)
  // + rota de redefinição. Não implementado por enquanto (depende de e-mail).

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
