import { useState } from 'react'

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

const KEY = 'installHintDismissed'

/** Dica discreta de instalação no Safari/iOS quando o app não está instalado. */
export default function InstallHint() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(KEY) === '1')

  if (dismissed || !isIOS() || isStandalone()) return null

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 p-3">
      <div className="mx-auto flex max-w-lg items-center gap-2 rounded-xl bg-white p-3 text-sm text-emerald-950 shadow-2xl">
        <span className="text-xl">📲</span>
        <p className="flex-1">
          Instale o app: toque em <b>Compartilhar</b>{' '}
          <span aria-hidden>⎋</span> e depois <b>“Adicionar à Tela de Início”</b>.
        </p>
        <button
          type="button"
          aria-label="Dispensar"
          onClick={() => {
            localStorage.setItem(KEY, '1')
            setDismissed(true)
          }}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/5 font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
