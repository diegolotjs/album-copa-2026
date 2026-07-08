import { useCallback, useRef, useState } from 'react'
import { useAlbum, type Tab } from '../store/album'
import type { SyncStatus } from '../lib/types'
import StatsPanel from './StatsPanel'
import SettingsSheet from './SettingsSheet'

const STATUS_LABEL: Record<SyncStatus, { text: string; cls: string; title: string }> = {
  synced: { text: 'Sincronizado ✓', cls: 'text-emerald-300', title: 'Tudo salvo na nuvem' },
  saving: { text: 'Salvando…', cls: 'text-amber-300', title: 'Enviando alterações' },
  offline: {
    text: 'Offline 💾',
    cls: 'text-white/70',
    title: 'Offline — alterações guardadas, sincronizo quando conectar',
  },
  local: { text: 'Local', cls: 'text-white/70', title: 'Dados apenas neste aparelho' },
  loading: { text: 'Conectando…', cls: 'text-white/60', title: 'Conectando à nuvem' },
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'missing', label: 'Faltam' },
  { id: 'dupes', label: 'Repetidas' },
]

export default function Header() {
  const mode = useAlbum((s) => s.mode)
  const setMode = useAlbum((s) => s.setMode)
  const tab = useAlbum((s) => s.tab)
  const setTab = useAlbum((s) => s.setTab)
  const query = useAlbum((s) => s.query)
  const setQuery = useAlbum((s) => s.setQuery)
  const view = useAlbum((s) => s.view)
  const setView = useAlbum((s) => s.setView)
  const status = useAlbum((s) => s.status)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const gearRef = useRef<HTMLButtonElement>(null)

  // Ao fechar, devolve o foco para a engrenagem (acessibilidade)
  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
    gearRef.current?.focus()
  }, [])

  const st = STATUS_LABEL[status]

  return (
    <header className="safe-top sticky top-0 z-20 border-b border-white/10 bg-pitch-900/95 backdrop-blur">
      <div className="mx-auto max-w-lg space-y-2 px-3 pb-2 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-bold tracking-wide">⚽ Álbum Copa 2026</h1>
          <div className="flex items-center gap-1">
            <span className={`text-[11px] ${st.cls}`} title={st.title} aria-live="polite">
              {st.text}
            </span>
            <button
              ref={gearRef}
              type="button"
              aria-label={settingsOpen ? 'Fechar ajustes' : 'Ajustes e backups'}
              aria-expanded={settingsOpen}
              onClick={() => (settingsOpen ? closeSettings() : setSettingsOpen(true))}
              className="flex size-11 items-center justify-center rounded-full text-lg hover:bg-white/10"
            >
              ⚙️
            </button>
          </div>
        </div>

        {view === 'album' ? (
          <>
            <StatsPanel />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'add' ? 'remove' : 'add')}
                className={`min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold transition-colors ${
                  mode === 'add' ? 'bg-emerald-500 text-emerald-950' : 'bg-accent text-white'
                }`}
              >
                Tocar para: {mode === 'add' ? '+ Adicionar' : '− Remover'}
              </button>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar seleção ou código"
                aria-label="Buscar seleção ou código"
                className="min-h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm placeholder:text-white/40 focus:border-foil-300"
              />
            </div>
            <nav className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1" aria-label="Abas">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id ? 'page' : undefined}
                  className={`min-h-10 rounded-md text-sm font-semibold transition-colors ${
                    tab === t.id ? 'bg-pitch-600 text-white shadow' : 'text-white/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setView('album')}
            className="min-h-11 rounded-lg bg-white/10 px-4 text-sm font-semibold"
          >
            ← Voltar ao álbum
          </button>
        )}
      </div>
      {settingsOpen && <SettingsSheet onClose={closeSettings} />}
    </header>
  )
}
