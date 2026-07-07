import { describe, expect, it } from 'vitest'
import { mergeItems, sameItems } from '../merge'
import type { ItemMap } from '../types'

const item = (q: number, u: number, r = '') => ({ q, r, u })

describe('merge por figurinha (updatedAt mais recente vence)', () => {
  it('local mais novo vence a nuvem', () => {
    const local: ItemMap = { BRA13: item(2, 200) }
    const cloud: ItemMap = { BRA13: item(1, 100) }
    expect(mergeItems(local, cloud).BRA13.q).toBe(2)
  })

  it('nuvem mais nova vence o local', () => {
    const local: ItemMap = { BRA13: item(2, 100) }
    const cloud: ItemMap = { BRA13: item(3, 200) }
    expect(mergeItems(local, cloud).BRA13.q).toBe(3)
  })

  it('mescla códigos diferentes dos dois lados (2+ aparelhos)', () => {
    const local: ItemMap = { MEX1: item(1, 100) }
    const cloud: ItemMap = { ARG7: item(1, 100) }
    const merged = mergeItems(local, cloud)
    expect(merged.MEX1.q).toBe(1)
    expect(merged.ARG7.q).toBe(1)
  })

  it('remoção (q=0) mais recente vence — tombstone propaga', () => {
    const local: ItemMap = { CC3: item(0, 300) }
    const cloud: ItemMap = { CC3: item(2, 100) }
    expect(mergeItems(local, cloud).CC3.q).toBe(0)
  })

  it('local vazio + nuvem com dados => resultado é a nuvem', () => {
    const cloud: ItemMap = { BRA13: item(1, 100), E5: item(3, 50, 'João') }
    const merged = mergeItems({}, cloud)
    expect(sameItems(merged, cloud)).toBe(true)
  })

  it('preserva reservadaPara no merge', () => {
    const local: ItemMap = { E5: item(3, 200, 'Maria') }
    const cloud: ItemMap = { E5: item(3, 100, 'João') }
    expect(mergeItems(local, cloud).E5.r).toBe('Maria')
  })
})
