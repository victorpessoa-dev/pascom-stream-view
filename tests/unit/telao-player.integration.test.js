import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAdsSignature, emptyTelaoSettings, shuffleArray } from '@/lib/services/telao-player'

describe('telao player integration helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('keeps a stable signature for the current ad list', () => {
    const signature = buildAdsSignature([
      { id: 'ad-1', updatedAt: '2024-01-01', duration: 10, active: true, src: 'a.webp', type: 'NORMAL' },
    ])

    expect(signature).toBe(JSON.stringify([
      { id: 'ad-1', updatedAt: '2024-01-01', duration: 10, active: true, src: 'a.webp', type: 'NORMAL' },
    ]))
  })

  it('uses the default empty settings and preserves the input order when shuffling is deterministic', () => {
    expect(emptyTelaoSettings).toMatchObject({ metricsEnabled: false, designs: { NORMAL: {}, MASTER: {} } })

    const original = ['a', 'b', 'c']
    expect(shuffleArray(original, () => 0)).toEqual(['c', 'a', 'b'])
  })
})
