import {
  buildSponsorPayload,
  mapPublicAdRow,
  mapSponsorImpressionRow,
  mapSponsorRow,
  mapSponsorStoreRow,
} from '@/lib/mappers/sponsors'
import {
  fetchPublicSponsorDetail,
  fetchPublicSponsorDirectory,
  fetchPublicSponsorImpressions,
  fetchPublicSponsors,
  fetchSponsorSettings,
  insertSponsor,
  updateSponsorById,
} from '@/lib/repositories/sponsors'

export async function getPublicAdsPayload(supabase) {
  const [ads, settings] = await Promise.all([
    fetchPublicSponsors(supabase),
    fetchSponsorSettings(supabase),
  ])

  return {
    ads: ads.map(mapPublicAdRow).filter((ad) => ad?.src),
    sponsorSettings: settings,
    fetchedAt: new Date().toISOString(),
  }
}

export async function getSponsorDirectoryPayload(supabase) {
  const advertisers = (await fetchPublicSponsorDirectory(supabase))
    .map(mapSponsorRow)
    .filter((advertiser) => advertiser?.active === true)

  return {
    totals: {
      advertisers: advertisers.length,
      totalViews: advertisers.reduce((sum, advertiser) => sum + (advertiser.views || 0), 0),
      totalSeconds: advertisers.reduce((sum, advertiser) => sum + (advertiser.totalSeconds || 0), 0),
    },
    advertisers,
  }
}

export async function getSponsorDetailPayload(supabase, sponsorId) {
  const [advertiserRow, logs] = await Promise.all([
    fetchPublicSponsorDetail(supabase, sponsorId),
    fetchPublicSponsorImpressions(supabase, sponsorId),
  ])

  const advertiser = mapSponsorRow(advertiserRow)
  if (!advertiser || advertiser.active !== true) return null

  return {
    advertiser,
    logs: logs.map(mapSponsorImpressionRow),
  }
}

export async function createSponsorForAdmin(supabase, ad) {
  return mapSponsorStoreRow(await insertSponsor(supabase, buildSponsorPayload(ad)))
}

export async function updateSponsorForAdmin(supabase, currentAd, updates) {
  const payload = buildSponsorPayload({ ...currentAd, ...updates })
  return mapSponsorStoreRow(await updateSponsorById(supabase, currentAd.id, payload))
}
