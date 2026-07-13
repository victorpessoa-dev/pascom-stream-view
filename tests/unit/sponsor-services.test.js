import { describe, expect, it } from 'vitest'
import {
  createSponsorForAdmin,
  getPublicAdsPayload,
  getSponsorDetailPayload,
  getSponsorDirectoryPayload,
  updateSponsorForAdmin,
} from '@/lib/services/sponsors'

function createSupabaseRpcMock(responses) {
  return {
    rpc(name) {
      if (!(name in responses)) {
        return Promise.resolve({ data: null, error: new Error(`RPC não mockada: ${name}`) })
      }

      return Promise.resolve({ data: responses[name], error: null })
    },
  }
}

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
          kind: 'MASTER',
          media_url: 'https://cdn.example/a.mp4',
          media_type: 'video',
          website_url: 'https://empresa.example',
          duration_seconds: 15,
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

describe('sponsor services', () => {
  it('builds the public ads payload from sponsors and settings RPCs', async () => {
    const payload = await getPublicAdsPayload(createSupabaseRpcMock({
      get_public_sponsors: [
        {
          id: 'sponsor-1',
          name: 'Empresa A',
          kind: 'NORMAL',
          media_url: 'https://cdn.example/a.webp',
          media_type: 'image',
          duration_seconds: 12,
          active: true,
        },
        {
          id: 'sponsor-2',
          name: 'Empresa B',
          kind: 'MASTER',
          media_url: '',
          media_type: 'image',
          duration_seconds: 10,
          active: true,
        },
      ],
      get_sponsor_settings: { enabled: true },
    }))

    expect(payload.ads).toHaveLength(1)
    expect(payload.ads[0]).toMatchObject({
      id: 'sponsor-1',
      src: 'https://cdn.example/a.webp',
      duration: 12,
    })
    expect(payload.sponsorSettings).toEqual({ enabled: true })
    expect(payload.fetchedAt).toEqual(expect.any(String))
  })

  it('builds sponsor directory totals', async () => {
    const payload = await getSponsorDirectoryPayload(createSupabaseRpcMock({
      get_public_sponsor_directory: [
        { id: 'a', name: 'A', views: 2, total_seconds: 20, active: true },
        { id: 'b', name: 'B', views: 3, total_seconds: 45, active: true },
      ],
    }))

    expect(payload.totals).toEqual({
      advertisers: 2,
      totalViews: 5,
      totalSeconds: 65,
    })
  })

  it('does not expose inactive sponsors in public directory payloads', async () => {
    const payload = await getSponsorDirectoryPayload(createSupabaseRpcMock({
      get_public_sponsor_directory: [
        { id: 'a', name: 'A', views: 2, total_seconds: 20, active: true },
        { id: 'b', name: 'B', views: 30, total_seconds: 450, active: false },
      ],
    }))

    expect(payload.advertisers).toHaveLength(1)
    expect(payload.advertisers[0]).toMatchObject({ id: 'a', active: true })
    expect(payload.totals).toEqual({
      advertisers: 1,
      totalViews: 2,
      totalSeconds: 20,
    })
  })

  it('does not expose inactive sponsor details publicly', async () => {
    await expect(getSponsorDetailPayload(createSupabaseRpcMock({
      get_public_sponsor_detail: {
        id: 'inactive-id',
        name: 'Empresa inativa',
        active: false,
      },
      get_public_sponsor_impressions: [
        { id: 'log-1', displayed_at: new Date().toISOString(), duration_seconds: 10 },
      ],
    }), 'inactive-id')).resolves.toBeNull()
  })

  it('returns null when sponsor detail is missing', async () => {
    await expect(getSponsorDetailPayload(createSupabaseRpcMock({
      get_public_sponsor_detail: null,
      get_public_sponsor_impressions: [],
    }), 'missing-id')).resolves.toBeNull()
  })

  it('creates sponsor records with normalized admin payloads', async () => {
    const { client, calls } = createSupabaseTableMock()

    const sponsor = await createSponsorForAdmin(client, {
      name: 'Empresa A',
      type: 'MASTER',
      src: 'https://cdn.example/a.mp4',
      mediaType: 'video',
      websiteUrl: 'https://empresa.example',
      duration: 15,
    })

    expect(calls).toContainEqual(['from', 'sponsors'])
    expect(calls).toContainEqual(['insert', expect.objectContaining({
      name: 'Empresa A',
      kind: 'MASTER',
      media_url: 'https://cdn.example/a.mp4',
      media_type: 'video',
      duration_seconds: 15,
    })])
    expect(sponsor).toMatchObject({ id: 'sponsor-1', sourceType: 'supabase' })
  })

  it('updates sponsor records by id with merged edit values', async () => {
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
    })

    expect(calls).toContainEqual(['eq', 'id', 'sponsor-1'])
    expect(calls).toContainEqual(['update', expect.objectContaining({
      name: 'Empresa A editada',
      kind: 'NORMAL',
      duration_seconds: 20,
    })])
  })
})
