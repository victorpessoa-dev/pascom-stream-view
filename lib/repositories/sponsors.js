export async function fetchPublicSponsors(supabase) {
  const { data, error } = await supabase.rpc('get_public_sponsors')
  if (error) throw error
  return data || []
}

export async function fetchSponsorSettings(supabase) {
  const { data, error } = await supabase.rpc('get_sponsor_settings')
  if (error) throw error
  return data || {}
}

export async function fetchPublicSponsorDirectory(supabase) {
  const { data, error } = await supabase.rpc('get_public_sponsor_directory')
  if (error) throw error
  return data || []
}

export async function fetchPublicSponsorDetail(supabase, sponsorId) {
  const { data, error } = await supabase.rpc('get_public_sponsor_detail', {
    sponsor_id_arg: sponsorId,
  })
  if (error) throw error
  return Array.isArray(data) ? data[0] : data
}

export async function fetchPublicSponsorImpressions(supabase, sponsorId) {
  const { data, error } = await supabase.rpc('get_public_sponsor_impressions', {
    sponsor_id_arg: sponsorId,
  })
  if (error) throw error
  return data || []
}

export const SPONSOR_SELECT = 'id, name, kind, media_url, media_type, image_url, website_url, duration_seconds, active, views, total_seconds, last_displayed_at, created_at, updated_at'

export async function listSponsors(supabase) {
  const { data, error } = await supabase
    .from('sponsors')
    .select(SPONSOR_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function insertSponsor(supabase, payload) {
  const { data, error } = await supabase
    .from('sponsors')
    .insert(payload)
    .select(SPONSOR_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updateSponsorById(supabase, id, payload) {
  const { data, error } = await supabase
    .from('sponsors')
    .update(payload)
    .eq('id', id)
    .select(SPONSOR_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteSponsorById(supabase, id) {
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllSponsors(supabase) {
  const { error } = await supabase
    .from('sponsors')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw error
}

export async function recordSponsorView(supabase, sponsorId, seconds) {
  const { error } = await supabase.rpc('record_sponsor_view', {
    sponsor_id: sponsorId,
    seconds,
  })

  if (error) throw error
}
