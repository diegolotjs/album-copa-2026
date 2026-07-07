import { describe, expect, it } from 'vitest'
import { canPush, isEmptyState } from '../merge'
import type { ItemMap } from '../types'

const data: ItemMap = { BRA13: { q: 1, r: '', u: 100 } }
const reservedOnly: ItemMap = { E5: { q: 0, r: 'João', u: 100 } }
const tombstones: ItemMap = { BRA13: { q: 0, r: '', u: 100 } }

describe('regra "nunca salvar vazio por cima de dados"', () => {
  it('bloqueia enviar estado sem nenhum registro por cima de nuvem com dados', () => {
    expect(canPush({}, data)).toBe(false)
  })

  it('permite enviar quando o novo estado tem dados', () => {
    expect(canPush(data, {})).toBe(true)
    expect(canPush(data, data)).toBe(true)
  })

  it('permite quando ambos são vazios (nada a perder)', () => {
    expect(canPush({}, {})).toBe(true)
  })

  it('"Zerar tudo" intencional (tombstones q=0 com updatedAt) PODE propagar', () => {
    expect(canPush(tombstones, data)).toBe(true)
  })

  it('reserva conta como dado', () => {
    expect(isEmptyState(reservedOnly)).toBe(false)
  })

  it('isEmptyState reconhece vazio de verdade', () => {
    expect(isEmptyState({})).toBe(true)
    expect(isEmptyState(tombstones)).toBe(true)
    expect(isEmptyState(data)).toBe(false)
  })
})
