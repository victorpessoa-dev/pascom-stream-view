import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'

function mapAdvertiser(row) {
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

function mapLog(row) {
  return {
    id: row.id,
    displayedAt: row.displayed_at,
    durationSeconds: row.duration_seconds || 0,
    source: row.source || 'telao',
  }
}

export async function GET(_, context) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()

    const [{ data: advertiserData, error: advertiserError }, { data: logsData, error: logsError }] = await Promise.all([
      supabase.rpc('get_public_sponsor_detail', { sponsor_id_arg: id }),
      supabase.rpc('get_public_sponsor_impressions', { sponsor_id_arg: id }),
    ])

    if (advertiserError) throw advertiserError
    if (logsError) throw logsError

    const advertiser = mapAdvertiser(Array.isArray(advertiserData) ? advertiserData[0] : advertiserData)
    if (!advertiser) {
      return NextResponse.json({ error: 'Anunciante não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      advertiser,
      logs: (logsData || []).map(mapLog),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar anunciante' },
      { status: 500 }
    )
  }
}
