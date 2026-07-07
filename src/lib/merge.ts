import type { Item, ItemMap } from './types'

/**
 * Merge POR FIGURINHA: para cada código, vence o updatedAt (u) mais recente.
 * Permite usar o álbum em 2+ aparelhos sem um sobrescrever o outro.
 */
export function mergeItems(local: ItemMap, cloud: ItemMap): ItemMap {
  const out: ItemMap = { ...cloud }
  for (const [code, li] of Object.entries(local)) {
    const ci = out[code]
    if (!ci || li.u > ci.u) out[code] = li
  }
  return out
}

/** Um mapa é "vazio" quando nenhuma figurinha tem quantidade ou reserva. */
export function isEmptyState(items: ItemMap | null | undefined): boolean {
  if (!items) return true
  return Object.values(items).every((i) => i.q === 0 && !i.r)
}

/**
 * REGRA DE OURO: nunca enviar um estado SEM NENHUM REGISTRO por cima de uma
 * nuvem que tem dados (cenário típico: carregamento local falhou/vazio).
 * Um "Zerar tudo" intencional grava tombstones (q=0 com updatedAt novo) —
 * tem registros, então passa e propaga corretamente aos outros aparelhos.
 */
export function canPush(next: ItemMap, cloud: ItemMap): boolean {
  return Object.keys(next).length > 0 || isEmptyState(cloud)
}

export function sameItem(a: Item | undefined, b: Item | undefined): boolean {
  if (!a || !b) return a === b
  return a.q === b.q && a.r === b.r && a.u === b.u
}

/** Compara dois mapas (para saber se um push/gravação é necessário). */
export function sameItems(a: ItemMap, b: ItemMap): boolean {
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) => sameItem(a[k], b[k]))
}
