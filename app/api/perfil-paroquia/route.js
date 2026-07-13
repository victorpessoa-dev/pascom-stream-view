import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'

const emptyProfile = {
  parishName: '',
  parishCity: '',
  parishProfile: '',
  parishLogoUrl: '/brand/icon-logo.svg',
  parishCoverUrl: '',
  parishInstagramUrl: '',
  parishFacebookUrl: '',
  parishYoutubeUrl: '',
  parishWhatsappUrl: '',
  parishWebsiteUrl: '',
  parishSocialLinks: [],
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.rpc('get_public_parish_profile')
    if (error) throw error

    return NextResponse.json({
      ...emptyProfile,
      ...(data || {}),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ...emptyProfile,
        error: error instanceof Error ? error.message : 'Falha ao carregar perfil da paróquia',
      },
      { status: 200 }
    )
  }
}
