import { useEffect, useRef } from 'react'
import { useAuth } from './store/auth'
import { useAlbum } from './store/album'
import { cloudEnabled } from './lib/supabase'
import { bootAlbum } from './lib/boot'
import Header from './components/Header'
import AlbumView from './components/AlbumView'
import MissingView from './components/MissingView'
import DupesView from './components/DupesView'
import SearchResults from './components/SearchResults'
import BackupsView from './components/BackupsView'
import LoginScreen from './components/LoginScreen'
import InstallHint from './components/InstallHint'
import Toast from './components/Toast'

export default function App() {
  const session = useAuth((s) => s.session)
  const ready = useAuth((s) => s.ready)

  if (!ready) return <Splash />
  if (cloudEnabled && !session) return <LoginScreen />
  return <Main userId={session?.user.id ?? null} />
}

function Main({ userId }: { userId: string | null }) {
  const loaded = useAlbum((s) => s.loaded)
  const tab = useAlbum((s) => s.tab)
  const view = useAlbum((s) => s.view)
  const query = useAlbum((s) => s.query)
  const booted = useRef(false)

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    void bootAlbum(userId)
  }, [userId])

  if (!loaded) return <Splash />

  return (
    <div className="min-h-dvh bg-pitch-900 text-white">
      <Header />
      <main className="mx-auto max-w-lg px-3 pb-28 pt-3 safe-bottom">
        {!cloudEnabled && (
          <p className="mb-3 rounded-lg bg-amber-500/15 px-3 py-2 text-xs text-amber-200">
            ⚠️ Nuvem não configurada — os dados ficam apenas neste aparelho.
          </p>
        )}
        {view === 'backups' ? (
          <BackupsView userId={userId} />
        ) : query.trim() ? (
          <SearchResults />
        ) : tab === 'all' ? (
          <AlbumView />
        ) : tab === 'missing' ? (
          <MissingView />
        ) : (
          <DupesView />
        )}
      </main>
      <InstallHint />
      <Toast />
    </div>
  )
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-pitch-900 text-white">
      <span className="text-5xl">⚽</span>
      <h1 className="font-display text-3xl font-bold">Álbum Copa 2026</h1>
      <p className="text-sm text-white/70">Carregando…</p>
    </div>
  )
}
