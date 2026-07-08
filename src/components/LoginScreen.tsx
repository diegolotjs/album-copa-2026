import { useState, type FormEvent } from 'react'
import { useAuth } from '../store/auth'

type Mode = 'signin' | 'signup'

export default function LoginScreen() {
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setBusy(true)
    setError('')
    const action = mode === 'signin' ? signIn : signUp
    const { error: err } = await action(email.trim(), password)
    setBusy(false)
    if (err) setError(err)
    // sucesso: a sessão entra via onAuthStateChange e o App troca de tela sozinho
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
  }

  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-pitch-700 to-pitch-900 px-6 text-white">
      <div className="text-center">
        <div className="mb-2 text-6xl">⚽</div>
        <h1 className="font-display text-4xl font-bold">Álbum Copa 2026</h1>
        <p className="mt-1 text-sm text-white/70">Suas figurinhas salvas e sincronizadas.</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => switchMode('signin')}
            className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'signin' ? 'bg-pitch-600 text-white shadow' : 'text-white/60'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => switchMode('signup')}
            className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'signup' ? 'bg-pitch-600 text-white shadow' : 'text-white/60'
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            aria-label="E-mail"
            className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-base placeholder:text-white/40 focus:border-foil-300"
          />
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signin' ? 'Sua senha' : 'Crie uma senha (mín. 6)'}
              aria-label="Senha"
              className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 pr-14 text-base placeholder:text-white/40 focus:border-foil-300"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-lg"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-foil-300 font-semibold text-emerald-950 disabled:opacity-60"
          >
            {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <p className="text-xs text-white/60">
            {mode === 'signin'
              ? 'Primeira vez? Toque em "Criar conta" — leva 10 segundos.'
              : 'A conta guarda seu álbum na nuvem e sincroniza entre aparelhos.'}
          </p>
          {/* "Esqueci a senha" entraria aqui (resetPasswordForEmail) — não
              implementado por enquanto, pois depende do fluxo de e-mail. */}
        </form>
      </div>
    </div>
  )
}
