/** Estado de uma figurinha. q=0 falta | q=1 colada | q>=2 repetida (q-1 repetidas). */
export interface Item {
  /** quantidade possuída */
  q: number
  /** reservada para (texto livre) */
  r: string
  /** updatedAt em ms — usado no merge por figurinha */
  u: number
}

export type ItemMap = Record<string, Item>

/** Estado completo persistido (local e nuvem). */
export interface AlbumStateData {
  items: ItemMap
}

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'local' | 'loading'
