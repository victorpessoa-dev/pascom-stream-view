import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as getAds } from '@/app/api/ads-novenario/route'
import { GET as getSponsors } from '@/app/api/anunciantes/route'
import { GET as getSponsorDetail } from '@/app/api/anunciantes/[id]/route'
import { GET as getParishProfile } from '@/app/api/perfil-paroquia/route'
import { POST as postSponsorLogs } from '@/app/api/anunciantes/logs/route'
import { POST as postLogout } from '@/app/logout/route'
import { createSupabaseServerClient } from '@/services/supabase/server'
import {
  getPublicAdsPayload,
  getSponsorDetailPayload,
  getSponsorDirectoryPayload,
} from '@/lib/services/sponsors'

vi.mock('@/services/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/services/sponsors', () => ({
  getPublicAdsPayload: vi.fn(),
  getSponsorDetailPayload: vi.fn(),
  getSponsorDirectoryPayload: vi.fn(),
}))

describe('API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns public ads from the sponsor service', async () => {
    const supabase = {}
    const payload = { ads: [{ id: 'ad-1' }], sponsorSettings: {}, fetchedAt: 'now' }
    createSupabaseServerClient.mockResolvedValue(supabase)
    getPublicAdsPayload.mockResolvedValue(payload)

    const response = await getAds()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(getPublicAdsPayload).toHaveBeenCalledWith(supabase)
  })

  it('returns sponsor directory payloads', async () => {
    const supabase = {}
    const payload = { totals: { advertisers: 1 }, advertisers: [{ id: 'ad-1' }] }
    createSupabaseServerClient.mockResolvedValue(supabase)
    getSponsorDirectoryPayload.mockResolvedValue(payload)

    const response = await getSponsors()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(getSponsorDirectoryPayload).toHaveBeenCalledWith(supabase)
  })

  it('returns the public parish profile', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        parishName: 'Paróquia São José',
        parishCity: 'Limeira - SP',
        parishProfile: 'PASCOM',
        parishLogoUrl: 'https://cdn.example/logo.png',
        parishCoverUrl: 'https://cdn.example/capa.png',
        parishInstagramUrl: 'https://instagram.com/pascom',
        parishFacebookUrl: 'https://facebook.com/pascom',
        parishYoutubeUrl: 'https://youtube.com/@pascom',
        parishWhatsappUrl: 'https://wa.me/5511999999999',
        parishWebsiteUrl: 'https://paroquia.example',
      },
      error: null,
    })
    createSupabaseServerClient.mockResolvedValue({ rpc })

    const response = await getParishProfile()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      parishName: 'Paróquia São José',
      parishCity: 'Limeira - SP',
      parishProfile: 'PASCOM',
      parishLogoUrl: 'https://cdn.example/logo.png',
      parishCoverUrl: 'https://cdn.example/capa.png',
      parishInstagramUrl: 'https://instagram.com/pascom',
      parishFacebookUrl: 'https://facebook.com/pascom',
      parishYoutubeUrl: 'https://youtube.com/@pascom',
      parishWhatsappUrl: 'https://wa.me/5511999999999',
      parishWebsiteUrl: 'https://paroquia.example',
    })
    expect(rpc).toHaveBeenCalledWith('get_public_parish_profile')
  })

  it('returns 404 when a sponsor detail does not exist', async () => {
    createSupabaseServerClient.mockResolvedValue({})
    getSponsorDetailPayload.mockResolvedValue(null)

    const response = await getSponsorDetail(null, { params: Promise.resolve({ id: 'missing' }) })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) })
  })

  it('records sponsor logs with one bulk RPC call', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 2, error: null })
    createSupabaseServerClient.mockResolvedValue({ rpc })
    const request = new Request('https://example.test/api/anunciantes/logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': crypto.randomUUID() },
      body: JSON.stringify({
        logs: [
          { sponsorId: '00000000-0000-4000-8000-000000000001', durationSeconds: 7 },
          { sponsor_id: '00000000-0000-4000-8000-000000000002', duration_seconds: 8 },
        ],
      }),
    })

    const response = await postSponsorLogs(request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true, processed: 2 })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('log_sponsor_impressions', {
      logs_arg: [
        expect.objectContaining({ sponsor_id: '00000000-0000-4000-8000-000000000001' }),
        expect.objectContaining({ sponsor_id: '00000000-0000-4000-8000-000000000002' }),
      ],
    })
  })

  it('keeps logout idempotent when Supabase signOut fails', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        signOut: vi.fn().mockRejectedValue(new Error('already gone')),
      },
    })

    const response = await postLogout()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
