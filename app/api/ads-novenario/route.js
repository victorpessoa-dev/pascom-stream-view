import { NextResponse } from 'next/server'
import { getPublicAdsPayload } from '@/lib/services/sponsors'
import { createSupabaseServerClient } from '@/services/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const payload = await getPublicAdsPayload(supabase)

    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar anúncios' },
      { status: 500 }
    )
  }
}
