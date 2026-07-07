import { useState, type FormEvent } from 'react'
import { useAuth } from '../store/auth'

export default function LoginScreen() {
  const sendMagicLink = useAuth((s) => s.sendMagicLink)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || busy) return
    setBusy(true)
    setError('')
    const { error: err } = await sendMagicLink(email.trim())
    setBusy(false)
    if (err) setError(err)
    else setSent(true)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-pitch-700 to-pitch-900 px-6 text-white safe-top safe-bottom">
      <div className="text-center">
        <div className="mb-2 text-6xl">⚽</div>
        <h1 className="font-display text-4xl font-bold">Álbum Copa 2026</h1>
        <p className="mt-1 text-sm text-white/70">Suas figurinhas salvas e sincronizadas.</p>
      </div>

      {sent ? (
        <div className="w-full max-w-sm rounded-2xl bg-white/10 p-5 text-center">
          <p className="text-lg font-semibold">📬 Link enviado!</p>
          <p className="mt-2 text-sm text-white/80">
            Enviei um link de acesso para <b>{email}</b>. Abra o e-mail <b>neste aparelho</b> e
            toque no link para entrar. Pode fechar esta tela.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-4 text-sm text-foil-300 underline"
          >
            Usar outro e-mail
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
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
            {busy ? 'Enviando…' : 'Enviar link mágico ✨'}
          </button>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <p className="text-xs text-white/60">
            Você receberá um link por e-mail — é só tocar nele e pronto, sem senha para decorar.
          </p>
        </form>
      )}
    </div>
  )
}
