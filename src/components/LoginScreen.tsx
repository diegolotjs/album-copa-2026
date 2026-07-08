import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../store/auth'

export default function LoginScreen() {
  const sendCode = useAuth((s) => s.sendCode)
  const verifyCode = useAuth((s) => s.verifyCode)

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  async function requestCode(): Promise<boolean> {
    setBusy(true)
    setError('')
    const { error: err } = await sendCode(email.trim())
    setBusy(false)
    if (err) {
      setError(err)
      return false
    }
    setCooldown(60)
    return true
  }

  async function onSubmitEmail(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || busy) return
    if (await requestCode()) {
      setCode('')
      setStep('code')
    }
  }

  async function onSubmitCode(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6 || busy) return
    setBusy(true)
    setError('')
    const { error: err } = await verifyCode(email.trim(), code)
    setBusy(false)
    if (err) setError(err)
    // sucesso: a sessão entra via onAuthStateChange e o App troca de tela sozinho
  }

  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-pitch-700 to-pitch-900 px-6 text-white">
      <div className="text-center">
        <div className="mb-2 text-6xl">⚽</div>
        <h1 className="font-display text-4xl font-bold">Álbum Copa 2026</h1>
        <p className="mt-1 text-sm text-white/70">Suas figurinhas salvas e sincronizadas.</p>
      </div>

      {step === 'email' ? (
        <form onSubmit={onSubmitEmail} className="w-full max-w-sm space-y-3">
          <label htmlFor="email" className="block text-sm font-semibold">
            Entre com seu e-mail (sem senha)
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-base placeholder:text-white/40 focus:border-foil-300"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-foil-300 font-semibold text-emerald-950 disabled:opacity-60"
          >
            {busy ? 'Enviando…' : 'Receber código por e-mail 📬'}
          </button>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <p className="text-xs text-white/60">
            Você recebe um código de 6 dígitos por e-mail — digita aqui e pronto, sem senha.
          </p>
        </form>
      ) : (
        <form onSubmit={onSubmitCode} className="w-full max-w-sm space-y-3">
          <label htmlFor="otp" className="block text-sm font-semibold">
            Digite o código de 6 dígitos que chegou no seu e-mail
          </label>
          <p className="text-xs text-white/60">
            Enviado para <b>{email}</b>. Pode demorar até 1 minuto para chegar.
          </p>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="······"
            aria-label="Código de 6 dígitos"
            className="min-h-14 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-center font-display text-3xl font-bold tracking-[0.4em] placeholder:text-white/30 focus:border-foil-300"
          />
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="min-h-12 w-full rounded-xl bg-foil-300 font-semibold text-emerald-950 disabled:opacity-50"
          >
            {busy ? 'Verificando…' : 'Entrar'}
          </button>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={busy || cooldown > 0}
              onClick={() => void requestCode()}
              className="text-foil-300 underline disabled:opacity-50 disabled:no-underline"
            >
              {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setError('')
              }}
              className="text-white/70 underline"
            >
              Usar outro e-mail
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
