import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { createSnapshot, downloadExport, parseImport } from '../lib/backup'
import { replaceLocalItems } from '../lib/db'
import { markDirty } from '../lib/sync'
import { cloudEnabled } from '../lib/supabase'
import { toast } from '../lib/toast'
import { useAlbum } from '../store/album'
import { useAuth } from '../store/auth'
import type { ItemMap } from '../lib/types'

/**
 * Drawer de ajustes num PORTAL para o <body>: dentro do header (que tem
 * backdrop-blur) um position:fixed seria posicionado em relação ao header,
 * não à tela — era o bug do painel "preso" no topo no iPhone.
 */
export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const setView = useAlbum((s) => s.setView)
  const session = useAuth((s) => s.session)
  const signOut = useAuth((s) => s.signOut)
  const fileRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [resetText, setResetText] = useState('')
  const [showReset, setShowReset] = useState(false)

  const userId = session?.user.id ?? null

  // Esc fecha (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Trava o scroll do fundo enquanto o modal está aberto.
  // body { position: fixed } é a única técnica confiável no iOS Safari.
  useEffect(() => {
    const y = window.scrollY
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = prev.position
      document.body.style.top = prev.top
      document.body.style.width = prev.width
      window.scrollTo(0, y)
    }
  }, [])

  // Foco inicial no botão de fechar (leitores de tela anunciam o diálogo)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  async function applyItems(items: ItemMap, snapshotReason: string, doneMsg: string) {
    if (userId) await createSnapshot(userId, useAlbum.getState().items, snapshotReason)
    useAlbum.setState({ items })
    await replaceLocalItems(items)
    markDirty()
    toast(doneMsg)
    onClose()
  }

  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const items = parseImport(await file.text())
    if (!items) {
      toast('Arquivo inválido 😕')
      return
    }
    await applyItems(items, 'pré-importação', 'Importado com sucesso! ✅')
  }

  async function onReset() {
    if (resetText !== 'ZERAR') return
    // tombstones (q=0 com updatedAt novo) para o zerar propagar aos outros aparelhos
    const now = Date.now()
    const cleared: ItemMap = {}
    for (const code of Object.keys(useAlbum.getState().items)) cleared[code] = { q: 0, r: '', u: now }
    await applyItems(cleared, 'pré-zerar', 'Álbum zerado.')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ajustes"
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[85dvh] w-full max-w-lg space-y-2 overflow-y-auto rounded-t-2xl bg-pitch-700 p-4 text-white shadow-2xl"
      >
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-white/30" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Ajustes</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg bg-white/10 px-4 text-sm font-semibold hover:bg-white/15"
          >
            ✕ Fechar
          </button>
        </div>

        <button type="button" className={btn} onClick={() => { setView('backups'); onClose() }}>
          ☁️ Backups (snapshots na nuvem)
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => {
            downloadExport(useAlbum.getState().items)
            toast('Backup JSON exportado 📤')
          }}
        >
          📤 Exportar JSON
        </button>

        <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
          📥 Importar JSON
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onImportFile(e)} />

        {!showReset ? (
          <button type="button" className={`${btn} text-red-300`} onClick={() => setShowReset(true)}>
            🗑️ Zerar tudo…
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-red-400/40 bg-red-500/10 p-3">
            <p className="text-sm">
              Isso zera TODAS as figurinhas (um backup é criado antes). Digite <b>ZERAR</b> para
              confirmar:
            </p>
            <input
              type="text"
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
              placeholder="ZERAR"
              className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-3"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={resetText !== 'ZERAR'}
                onClick={() => void onReset()}
                className="min-h-11 flex-1 rounded-lg bg-red-500 font-semibold disabled:opacity-40"
              >
                Zerar tudo
              </button>
              <button
                type="button"
                onClick={() => { setShowReset(false); setResetText('') }}
                className="min-h-11 flex-1 rounded-lg bg-white/10 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {cloudEnabled && session && (
          <button type="button" className={btn} onClick={() => void signOut()}>
            🚪 Sair ({session.user.email})
          </button>
        )}

        <p className="pt-1 text-center text-[11px] text-white/50">
          Álbum Copa 2026 · v1.0.0 · dados locais + nuvem
        </p>
      </div>
    </div>,
    document.body,
  )
}

const btn =
  'w-full min-h-12 rounded-lg bg-white/10 px-4 text-left text-sm font-semibold hover:bg-white/15'
