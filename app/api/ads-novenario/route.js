import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'

function mapAd(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.kind,
    src: row.media_url || row.image_url || '',
    mediaType: row.media_type || 'image',
    duration: row.duration_seconds || 10,
    views: row.views || 0,
    totalSeconds: row.total_seconds || 0,
    websiteUrl: row.website_url || '',
    lastDisplayedAt: row.last_displayed_at || null,
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const [{ data: ads, error: adsError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.rpc('get_public_sponsors'),
      supabase.rpc('get_sponsor_settings'),
    ])

    if (adsError) throw adsError
    if (settingsError) throw settingsError

    return NextResponse.json({
      ads: (ads || []).map(mapAd).filter((ad) => ad.src),
      sponsorSettings: settings || {},
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar anúncios' },
      { status: 500 }
    )
  }
}
