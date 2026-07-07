import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, cloudEnabled } from './supabase'
import { getMeta, setMeta, replaceLocalItems } from './db'
import { mergeItems, canPush, sameItems } from './merge'
import { migrateState, SCHEMA_VERSION } from './migrations'
import type { ItemMap, SyncStatus } from './types'

/**
 * Motor de sincronização LOCAL-FIRST.
 * - Toda alteração já foi gravada no IndexedDB antes de chegar aqui; a nuvem
 *   é espelho de segurança e a interface NUNCA espera rede.
 * - A "fila" é o flag persistente `dirty` (meta no IndexedDB) + o próprio
 *   estado local: fechar o app não perde alterações pendentes.
 * - Push com debounce (~2s); flush com keepalive em visibilitychange(hidden),
 *   pagehide e freeze (essencial no iOS).
 * - Pull ao abrir e ao voltar do background; MERGE POR FIGURINHA (updatedAt).
 * - GUARDA: nunca envia estado vazio por cima de nuvem com dados, e só envia
 *   depois do primeiro pull+merge bem-sucedido.
 */

export interface SyncHooks {
  getItems(): ItemMap
  setItems(items: ItemMap): void
  setStatus(status: SyncStatus): void
}

let hooks: SyncHooks | null = null
let uid: string | null = null
let accessToken: string | null = null
let lastCloud: ItemMap = {}
let pulledOnce = false
let dirty = false
let debounceTimer: number | undefined
let retryTimer: number | undefined
let retryDelay = 5_000
let listenersInstalled = false

export function configureSync(h: SyncHooks): void {
  hooks = h
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export async function startSync(userId: string): Promise<void> {
  if (!supabase || !hooks) return
  uid = userId
  dirty = await getMeta('dirty', false)
  installListeners()
  await pullAndMerge()
  if (dirty) schedulePush(0)
}

export function stopSync(): void {
  uid = null
  pulledOnce = false
  lastCloud = {}
  window.clearTimeout(debounceTimer)
  window.clearTimeout(retryTimer)
}

/** Marca que há alterações locais pendentes e agenda o envio (debounce ~2s). */
export function markDirty(): void {
  dirty = true
  void setMeta('dirty', true)
  if (!cloudEnabled || !uid) {
    hooks?.setStatus('local')
    return
  }
  hooks?.setStatus('saving')
  schedulePush(2_000)
}

function schedulePush(delay: number): void {
  if (!uid) return
  window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => void flushNow(), delay)
}

function scheduleRetry(): void {
  window.clearTimeout(retryTimer)
  retryTimer = window.setTimeout(() => void flushNow(), retryDelay)
  retryDelay = Math.min(retryDelay * 2, 5 * 60_000)
}

export async function pullAndMerge(): Promise<boolean> {
  if (!supabase || !uid || !hooks) return false
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('state, schema_version')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) throw error

    let cloudItems: ItemMap = {}
    if (data) {
      cloudItems = migrateState(data.state, data.schema_version ?? SCHEMA_VERSION).items
    }
    lastCloud = cloudItems
    pulledOnce = true

    const local = hooks.getItems()
    // Merge POR FIGURINHA: vence o updatedAt mais recente de cada código.
    // Local vazio + nuvem com dados => nuvem vence (não há itens locais).
    const merged = mergeItems(local, cloudItems)

    if (!sameItems(merged, local)) {
      hooks.setItems(merged)
      await replaceLocalItems(merged)
    }
    if (!sameItems(merged, cloudItems)) {
      dirty = true
      await setMeta('dirty', true)
      schedulePush(0)
    } else if (!dirty) {
      hooks.setStatus('synced')
    }
    return true
  } catch {
    hooks.setStatus(dirty || !navigator.onLine ? 'offline' : 'synced')
    return false
  }
}

export async function flushNow(useKeepalive = false): Promise<void> {
  if (!supabase || !uid || !hooks || !dirty) return

  // Só envia depois do primeiro pull+merge com sucesso.
  if (!pulledOnce) {
    const ok = await pullAndMerge()
    if (!ok) {
      scheduleRetry()
      return
    }
  }

  const items = hooks.getItems()
  // GUARDA: nunca sobrescrever a nuvem (com dados) usando estado sem registros.
  if (!canPush(items, lastCloud)) return

  const merged = mergeItems(items, lastCloud)
  const payload = {
    user_id: uid,
    state: { items: merged },
    schema_version: SCHEMA_VERSION,
    updated_at: new Date().toISOString(),
  }

  if (useKeepalive) {
    // Envio confiável ao ir para background (iOS): fetch com keepalive.
    // Mantém `dirty` até um flush normal confirmar.
    try {
      void fetch(`${SUPABASE_URL}/rest/v1/collections`, {
        method: 'POST',
        keepalive: true,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken ?? ''}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      })
    } catch {
      /* melhor esforço — o retry normal cobre */
    }
    return
  }

  hooks.setStatus('saving')
  try {
    const { error } = await supabase.from('collections').upsert(payload)
    if (error) throw error
    lastCloud = merged
    dirty = false
    await setMeta('dirty', false)
    retryDelay = 5_000
    hooks.setStatus('synced')
  } catch {
    hooks.setStatus('offline')
    scheduleRetry()
  }
}

function installListeners(): void {
  if (listenersInstalled) return
  listenersInstalled = true

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushNow(true)
    } else {
      void pullAndMerge()
    }
  })
  window.addEventListener('pagehide', () => void flushNow(true))
  document.addEventListener('freeze', () => void flushNow(true))
  window.addEventListener('online', () => {
    retryDelay = 5_000
    hooks?.setStatus(dirty ? 'saving' : 'synced')
    void pullAndMerge().then(() => {
      if (dirty) schedulePush(0)
    })
  })
  window.addEventListener('offline', () => hooks?.setStatus('offline'))
}
