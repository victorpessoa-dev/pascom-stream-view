import { NextResponse } from 'next/server'
import { getSponsorDetailPayload } from '@/lib/services/sponsors'
import { createSupabaseServerClient } from '@/services/supabase/server'

export async function GET(_, context) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const payload = await getSponsorDetailPayload(supabase, id)
    if (!payload) return NextResponse.json({ error: 'Anunciante não encontrado' }, { status: 404 })

    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar anunciante' },
      { status: 500 }
    )
  }
}
