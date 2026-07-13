import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/cache/rate-limit'
import { createSupabaseServerClient } from '@/services/supabase/server'

const logSchema = z.object({
  sponsorId: z.string().uuid().optional(),
  sponsor_id: z.string().uuid().optional(),
  displayedAt: z.string().datetime().optional(),
  displayed_at: z.string().datetime().optional(),
  durationSeconds: z.coerce.number().min(0).max(3600).optional(),
  duration_seconds: z.coerce.number().min(0).max(3600).optional(),
  source: z.string().trim().min(1).max(40).default('telao'),
}).transform((payload) => ({
  sponsorId: payload.sponsorId || payload.sponsor_id,
  displayedAt: payload.displayedAt || payload.displayed_at || new Date().toISOString(),
  durationSeconds: Math.max(0, Number(payload.durationSeconds ?? payload.duration_seconds ?? 0) || 0),
  source: payload.source || 'telao',
})).refine((payload) => Boolean(payload.sponsorId), {
  message: 'sponsorId é obrigatório',
  path: ['sponsorId'],
})

const bodySchema = z.union([
  logSchema,
  z.object({ logs: z.array(logSchema).min(1).max(100) }),
])

export function normalizeLogPayload(body) {
  const parsed = bodySchema.parse(body)
  return Array.isArray(parsed.logs) ? parsed.logs : [parsed]
}

export async function POST(request) {
  try {
    const rate = await checkRateLimit(`sponsor-logs:${getClientIp(request)}`, {
      limit: 120,
      windowMs: 60_000,
    })

    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em instantes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const logs = normalizeLogPayload(body)
    const supabase = await createSupabaseServerClient()

    const { data: processed, error } = await supabase.rpc('log_sponsor_impressions', {
      logs_arg: logs.map((log) => ({
        sponsor_id: log.sponsorId,
        displayed_at: log.displayedAt,
        duration_seconds: log.durationSeconds,
        source: log.source,
      })),
    })

    if (error) throw error

    return NextResponse.json({ ok: true, processed: Number(processed) || 0 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Payload inválido', issues: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao registrar exibição' },
      { status: 500 }
    )
  }
}
