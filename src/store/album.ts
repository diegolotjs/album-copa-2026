import { create } from 'zustand'
import type { ItemMap, SyncStatus } from '../lib/types'
import { saveLocalItem } from '../lib/db'
import { configureSync, markDirty } from '../lib/sync'

export type Mode = 'add' | 'remove'
export type Tab = 'all' | 'missing' | 'dupes'
export type View = 'album' | 'backups'

interface AlbumStore {
  items: ItemMap
  /** só permite gravar depois que o carregamento inicial terminou */
  loaded: boolean
  mode: Mode
  tab: Tab
  view: View
  query: string
  status: SyncStatus
  tap(code: string): void
  markStuck(code: string): void
  setReserved(code: string, r: string): void
  setMode(mode: Mode): void
  setTab(tab: Tab): void
  setView(view: View): void
  setQuery(query: string): void
}

function writeItem(code: string, item: { q: number; r: string; u: number }): void {
  // grava IMEDIATAMENTE no IndexedDB; a interface nunca espera a rede
  void saveLocalItem(code, item)
  markDirty()
}

export const useAlbum = create<AlbumStore>((set, get) => ({
  items: {},
  loaded: false,
  mode: 'add',
  tab: 'all',
  view: 'album',
  query: '',
  status: 'loading',

  tap(code) {
    const { items, mode, loaded } = get()
    if (!loaded) return
    const cur = items[code] ?? { q: 0, r: '', u: 0 }
    const q = mode === 'add' ? cur.q + 1 : Math.max(0, cur.q - 1)
    if (q === cur.q) return
    const item = { ...cur, q, u: Date.now() }
    set({ items: { ...items, [code]: item } })
    writeItem(code, item)
  },

  markStuck(code) {
    const { items, loaded } = get()
    if (!loaded) return
    const cur = items[code] ?? { q: 0, r: '', u: 0 }
    if (cur.q !== 0) return
    const item = { ...cur, q: 1, u: Date.now() }
    set({ items: { ...items, [code]: item } })
    writeItem(code, item)
  },

  setReserved(code, r) {
    const { items, loaded } = get()
    if (!loaded) return
    const cur = items[code] ?? { q: 0, r: '', u: 0 }
    if (cur.r === r) return
    const item = { ...cur, r, u: Date.now() }
    set({ items: { ...items, [code]: item } })
    writeItem(code, item)
  },

  setMode: (mode) => set({ mode }),
  setTab: (tab) => set({ tab, query: '' }),
  setView: (view) => set({ view }),
  setQuery: (query) => set({ query }),
}))

// Registra os ganchos do motor de sync (evita import circular).
configureSync({
  getItems: () => useAlbum.getState().items,
  setItems: (items: ItemMap) => useAlbum.setState({ items }),
  setStatus: (status: SyncStatus) => useAlbum.setState({ status }),
})
