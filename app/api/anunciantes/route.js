import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'

function mapAdvertiser(row) {
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

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.rpc('get_public_sponsor_directory')

    if (error) throw error

    const advertisers = (data || []).map(mapAdvertiser)

    return NextResponse.json({
      totals: {
        advertisers: advertisers.length,
        totalViews: advertisers.reduce((sum, advertiser) => sum + (advertiser.views || 0), 0),
        totalSeconds: advertisers.reduce((sum, advertiser) => sum + (advertiser.totalSeconds || 0), 0),
      },
      advertisers,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar anunciantes' },
      { status: 500 }
    )
  }
}
