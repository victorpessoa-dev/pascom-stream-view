export async function getAppSetting(supabase, key) {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) throw error
  return data?.value
}

export async function upsertAppSetting(supabase, key, value) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) throw error
}
