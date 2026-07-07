import type { AlbumStateData } from './types'

/**
 * Versão atual do schema de dados. Ao mudar o formato no futuro:
 *  1. Incrementar SCHEMA_VERSION.
 *  2. Adicionar uma função em MIGRATIONS[versãoAntiga] que converte
 *     versãoAntiga -> versãoAntiga+1 SEM descartar dados.
 * NUNCA renomear o banco IndexedDB ('album-copa-2026') nem apagar chaves
 * antigas sem migrá-las.
 */
export const SCHEMA_VERSION = 1

type MigrationFn = (state: unknown) => unknown

const MIGRATIONS: Record<number, MigrationFn> = {
  // 0 -> 1: formato inicial era um mapa "cru" de itens, sem envelope { items }.
  0: (state) => {
    const s = state as Record<string, unknown> | null | undefined
    if (s && typeof s === 'object' && 'items' in s) return s
    return { items: s ?? {} }
  },
}

/** Roda as migrações necessárias de `from` até SCHEMA_VERSION. */
export function migrateState(state: unknown, from: number): AlbumStateData {
  let s = state
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const fn = MIGRATIONS[v]
    if (fn) s = fn(s)
  }
  const result = s as AlbumStateData
  if (!result || typeof result !== 'object' || typeof result.items !== 'object' || result.items === null) {
    // Formato irrecuperável: preserva nada, mas NUNCA lança fora dados válidos —
    // quem chama decide (e sempre há snapshot antes de migrar).
    return { items: {} }
  }
  return result
}
