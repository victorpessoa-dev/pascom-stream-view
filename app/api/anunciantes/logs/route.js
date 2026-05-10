import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'

function normalizeLog(payload) {
  return {
    sponsorId: payload?.sponsorId || payload?.sponsor_id || null,
    displayedAt: payload?.displayedAt || payload?.displayed_at || new Date().toISOString(),
    durationSeconds: Math.max(0, Number(payload?.durationSeconds ?? payload?.duration_seconds ?? 0) || 0),
    source: payload?.source || 'telao',
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const logs = Array.isArray(body?.logs) ? body.logs.map(normalizeLog) : [normalizeLog(body)]

    if (logs.some((log) => !log.sponsorId)) {
      return NextResponse.json({ error: 'sponsorId é obrigatório' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    for (const log of logs) {
      const { error } = await supabase.rpc('log_sponsor_impression', {
        sponsor_id: log.sponsorId,
        displayed_at_arg: log.displayedAt,
        duration_seconds_arg: log.durationSeconds,
        source_arg: log.source,
      })

      if (error) throw error
    }

    return NextResponse.json({ ok: true, processed: logs.length })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao registrar exibição' },
      { status: 500 }
    )
  }
}
