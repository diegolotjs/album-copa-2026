import { describe, expect, it } from 'vitest'
import { migrateState, SCHEMA_VERSION } from '../migrations'

describe('migração de schema', () => {
  it('v0 (mapa cru, sem envelope) migra para { items } sem perder dados', () => {
    const legacy = { BRA13: { q: 2, r: '', u: 123 } }
    const migrated = migrateState(legacy, 0)
    expect(migrated.items.BRA13.q).toBe(2)
    expect(migrated.items.BRA13.u).toBe(123)
  })

  it('estado na versão atual passa intacto', () => {
    const state = { items: { MEX1: { q: 1, r: 'Ana', u: 42 } } }
    const migrated = migrateState(state, SCHEMA_VERSION)
    expect(migrated).toEqual(state)
  })

  it('v0 que já tem envelope { items } não é embrulhado de novo', () => {
    const state = { items: { CC1: { q: 1, r: '', u: 7 } } }
    expect(migrateState(state, 0).items.CC1.q).toBe(1)
  })

  it('entrada irrecuperável vira estado vazio válido (nunca quebra o app)', () => {
    expect(migrateState(null, 0).items).toEqual({})
    expect(migrateState('lixo', SCHEMA_VERSION).items).toEqual({})
  })
})
