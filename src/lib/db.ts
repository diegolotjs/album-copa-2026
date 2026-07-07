import Dexie, { type Table } from 'dexie'
import type { Item, ItemMap } from './types'

export interface ItemRow extends Item {
  code: string
}

export interface MetaRow {
  key: string
  value: unknown
}

/**
 * Banco local (IndexedDB). O nome 'album-copa-2026' NUNCA deve mudar entre
 * versões — trocar o nome descartaria os dados dos usuários.
 */
class AlbumDB extends Dexie {
  items!: Table<ItemRow, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('album-copa-2026')
    this.version(1).stores({
      items: 'code',
      meta: 'key',
    })
  }
}

export const db = new AlbumDB()

export async function loadLocalItems(): Promise<ItemMap> {
  const rows = await db.items.toArray()
  const map: ItemMap = {}
  for (const row of rows) map[row.code] = { q: row.q, r: row.r, u: row.u }
  return map
}

export async function saveLocalItem(code: string, item: Item): Promise<void> {
  await db.items.put({ code, ...item })
}

export async function replaceLocalItems(items: ItemMap): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    await db.items.clear()
    await db.items.bulkPut(Object.entries(items).map(([code, i]) => ({ code, ...i })))
  })
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key)
  return row ? (row.value as T) : fallback
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}
