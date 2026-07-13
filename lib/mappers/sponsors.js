export function mapSponsorRow(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    type: row.kind,
    src: row.media_url || row.image_url || '',
    mediaType: row.media_type || 'image',
    websiteUrl: row.website_url || '',
    duration: row.duration_seconds || 10,
    views: row.views || 0,
    totalSeconds: row.total_seconds || 0,
    active: Boolean(row.active),
    lastDisplayedAt: row.last_displayed_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  }
}

export function mapPublicAdRow(row) {
  const sponsor = mapSponsorRow(row)
  if (!sponsor) return null

  return {
    id: sponsor.id,
    name: sponsor.name,
    type: sponsor.type,
    src: sponsor.src,
    mediaType: sponsor.mediaType,
    duration: sponsor.duration,
    views: sponsor.views,
    totalSeconds: sponsor.totalSeconds,
    websiteUrl: sponsor.websiteUrl,
    lastDisplayedAt: sponsor.lastDisplayedAt,
  }
}

export function mapSponsorImpressionRow(row) {
  return {
    id: row.id,
    displayedAt: row.displayed_at,
    durationSeconds: row.duration_seconds || 0,
    source: row.source || 'telao',
  }
}

export function mapSponsorStoreRow(row) {
  const sponsor = mapSponsorRow(row)
  if (!sponsor) return null

  return {
    ...sponsor,
    sourceType: 'supabase',
  }
}

export function buildSponsorPayload(ad) {
  return {
    name: ad.name,
    kind: ad.type || 'NORMAL',
    media_url: ad.src || '',
    image_url: ad.mediaType === 'image' ? ad.src || '' : null,
    media_type: ad.mediaType || 'image',
    website_url: ad.websiteUrl || null,
    duration_seconds: Math.max(3, Number(ad.duration) || 10),
    active: ad.active ?? true,
  }
}
