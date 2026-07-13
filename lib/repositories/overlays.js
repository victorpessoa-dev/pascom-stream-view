export const OVERLAY_SELECT = 'id, public_id, name, width, height, data, created_at, updated_at'

export async function listOverlays(supabase) {
  const { data, error } = await supabase
    .from('overlays')
    .select(OVERLAY_SELECT)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function insertOverlay(supabase, payload) {
  const { data, error } = await supabase
    .from('overlays')
    .insert(payload)
    .select(OVERLAY_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updateOverlayById(supabase, id, payload) {
  const { data, error } = await supabase
    .from('overlays')
    .update(payload)
    .eq('id', id)
    .select(OVERLAY_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteOverlayById(supabase, id) {
  const { error } = await supabase.from('overlays').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllOverlays(supabase) {
  const { error } = await supabase
    .from('overlays')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw error
}
