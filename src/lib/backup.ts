import { supabase } from './supabase'
import { getMeta, setMeta } from './db'
import { isEmptyState } from './merge'
import { migrateState, SCHEMA_VERSION } from './migrations'
import type { Item, ItemMap } from './types'

export interface SnapshotRow {
  id: string
  reason: string
  created_at: string
}

const KEEP = 30

/** Cria um snapshot do estado na nuvem e poda para manter os últimos 30. */
export async function createSnapshot(uid: string, items: ItemMap, reason: string): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('snapshots')
      .insert({ user_id: uid, state: { items }, reason })
    if (error) throw error
    await pruneSnapshots(uid)
    return true
  } catch {
    return false
  }
}

async function pruneSnapshots(uid: string): Promise<void> {
  if (!supabase) return
  const { data } = await supabase
    .from('snapshots')
    .select('id')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
  if (data && data.length > KEEP) {
    const ids = data.slice(KEEP).map((r) => r.id)
    await supabase.from('snapshots').delete().in('id', ids)
  }
}

/** 1 snapshot automático por dia de uso (se houver dados). */
export async function maybeDailySnapshot(uid: string, items: ItemMap): Promise<void> {
  if (isEmptyState(items)) return
  const today = new Date().toISOString().slice(0, 10)
  const last = await getMeta('lastSnapshotDay', '')
  if (last === today) return
  if (await createSnapshot(uid, items, 'diário')) {
    await setMeta('lastSnapshotDay', today)
  }
}

export async function listSnapshots(uid: string): Promise<SnapshotRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('snapshots')
    .select('id, reason, created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function getSnapshotItems(id: string): Promise<ItemMap | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('snapshots').select('state').eq('id', id).maybeSingle()
  if (error || !data) return null
  return migrateState(data.state, SCHEMA_VERSION).items
}

/* ---------- Export / Import JSON (rede de segurança extra) ---------- */

export function buildExportJSON(items: ItemMap): string {
  return JSON.stringify(
    {
      app: 'album-copa-2026',
      schema_version: SCHEMA_VERSION,
      exported_at: new Date().toISOString(),
      state: { items },
    },
    null,
    2,
  )
}

export function downloadExport(items: ItemMap): void {
  const blob = new Blob([buildExportJSON(items)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `album-copa-2026-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Valida e normaliza um JSON importado. Retorna null se inválido. */
export function parseImport(text: string): ItemMap | null {
  try {
    const raw = JSON.parse(text) as Record<string, unknown>
    const version = typeof raw.schema_version === 'number' ? raw.schema_version : 0
    const state = migrateState(raw.state ?? raw, version)
    const items: ItemMap = {}
    const now = Date.now()
    for (const [code, value] of Object.entries(state.items)) {
      const v = value as Partial<Item> | null
      if (!v || typeof v !== 'object') continue
      const q = typeof v.q === 'number' && v.q >= 0 ? Math.floor(v.q) : 0
      const r = typeof v.r === 'string' ? v.r : ''
      if (q === 0 && !r) continue
      // updatedAt = agora: o estado importado vence no merge com a nuvem
      items[code] = { q, r, u: now }
    }
    return items
  } catch {
    return null
  }
}
