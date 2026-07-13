import { NextResponse } from 'next/server'
import { getPublicAdsPayload } from '@/lib/services/sponsors'
import { NO_STORE_HEADERS } from '@/lib/utils/http'
import { createSupabaseServerClient } from '@/services/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const payload = await getPublicAdsPayload(supabase)

    return NextResponse.json(payload, { headers: NO_STORE_HEADERS })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar anúncios' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
