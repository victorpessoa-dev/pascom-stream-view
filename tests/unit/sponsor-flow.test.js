import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorForAdmin, updateSponsorForAdmin } from '@/lib/services/sponsors'

function createSupabaseTableMock() {
  const calls = []
  const builder = {
    insert(payload) {
      calls.push(['insert', payload])
      return builder
    },
    update(payload) {
      calls.push(['update', payload])
      return builder
    },
    eq(column, value) {
      calls.push(['eq', column, value])
      return builder
    },
    select(columns) {
      calls.push(['select', columns])
      return builder
    },
    single() {
      return Promise.resolve({
        data: {
          id: 'sponsor-1',
          name: 'Empresa A',
          kind: 'NORMAL',
          media_url: 'https://cdn.example/a.webp',
          media_type: 'image',
          website_url: 'https://empresa.example',
          duration_seconds: 12,
          active: true,
        },
        error: null,
      })
    },
  }

  return {
    calls,
    client: {
      from(table) {
        calls.push(['from', table])
        return builder
      },
    },
  }
}

describe('sponsor admin flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a sponsor with normalized admin payloads', async () => {
    const { client, calls } = createSupabaseTableMock()

    const sponsor = await createSponsorForAdmin(client, {
      name: 'Empresa A',
      type: 'NORMAL',
      src: 'https://cdn.example/a.webp',
      mediaType: 'image',
      websiteUrl: 'https://empresa.example',
      duration: 12,
    })

    expect(calls).toContainEqual(['from', 'sponsors'])
    expect(calls).toContainEqual(['insert', expect.objectContaining({
      name: 'Empresa A',
      kind: 'NORMAL',
      media_url: 'https://cdn.example/a.webp',
      duration_seconds: 12,
    })])
    expect(sponsor).toMatchObject({ id: 'sponsor-1', sourceType: 'supabase' })
  })

  it('updates an existing sponsor with merged edit values', async () => {
    const { client, calls } = createSupabaseTableMock()

    await updateSponsorForAdmin(client, {
      id: 'sponsor-1',
      name: 'Empresa A',
      type: 'NORMAL',
      src: 'https://cdn.example/a.webp',
      mediaType: 'image',
      duration: 10,
    }, {
      name: 'Empresa A editada',
      duration: 20,
      active: false,
    })

    expect(calls).toContainEqual(['eq', 'id', 'sponsor-1'])
    expect(calls).toContainEqual(['update', expect.objectContaining({
      name: 'Empresa A editada',
      kind: 'NORMAL',
      duration_seconds: 20,
      active: false,
    })])
  })
})
