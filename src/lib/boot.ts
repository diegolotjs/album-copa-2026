import { loadLocalItems, replaceLocalItems, getMeta, setMeta } from './db'
import { migrateState, SCHEMA_VERSION } from './migrations'
import { startSync } from './sync'
import { createSnapshot, maybeDailySnapshot } from './backup'
import { cloudEnabled } from './supabase'
import { useAlbum } from '../store/album'

/**
 * Sequência de abertura:
 * 1. Carrega o estado local (IndexedDB) — o app fica usável imediatamente.
 * 2. Roda migração de schema local se necessário (com snapshot antes).
 * 3. Dispara o sync (pull + merge por figurinha) em paralelo.
 * Só depois do passo 1 é que `loaded` libera gravações — nunca gravamos
 * por cima de dados que ainda não foram lidos.
 */
export async function bootAlbum(userId: string | null): Promise<void> {
  const storedVersion = await getMeta<number>('schema_version', SCHEMA_VERSION)
  let items = await loadLocalItems()

  if (storedVersion < SCHEMA_VERSION) {
    if (userId) await createSnapshot(userId, items, 'pré-migração')
    items = migrateState({ items }, storedVersion).items
    await replaceLocalItems(items)
  }
  await setMeta('schema_version', SCHEMA_VERSION)

  useAlbum.setState({
    items,
    loaded: true,
    status: cloudEnabled && userId ? 'loading' : 'local',
  })

  if (cloudEnabled && userId) {
    await startSync(userId)
    await maybeDailySnapshot(userId, useAlbum.getState().items)
  }
}
