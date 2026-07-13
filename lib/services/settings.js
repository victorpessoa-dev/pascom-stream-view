import { defaultAdminSettings, mergeAdminSettings } from '@/lib/mappers/settings'
import { deleteAllOverlays } from '@/lib/repositories/overlays'
import { deleteAllSponsors } from '@/lib/repositories/sponsors'
import { getAppSetting, upsertAppSetting } from '@/lib/repositories/settings'

export async function getAdminSettings(supabase) {
  return mergeAdminSettings(await getAppSetting(supabase, 'admin_settings'))
}

export async function saveAdminSettings(supabase, settings) {
  const normalized = mergeAdminSettings(settings)
  await upsertAppSetting(supabase, 'admin_settings', normalized)
  return normalized
}

export async function resetAdminSettings(supabase) {
  await upsertAppSetting(supabase, 'admin_settings', defaultAdminSettings)
  return defaultAdminSettings
}

export async function resetAdministrativeData(supabase) {
  await Promise.all([
    deleteAllOverlays(supabase),
    deleteAllSponsors(supabase),
    upsertAppSetting(supabase, 'admin_settings', defaultAdminSettings),
  ])

  return defaultAdminSettings
}

export async function getTelaoDefaultDurations(supabase) {
  const settings = await getAdminSettings(supabase)

  return {
    NORMAL: Number(settings.telao.defaultDurationNormal) || Number(settings.telao.defaultDuration) || 10,
    MASTER: Number(settings.telao.defaultDurationMaster) || Number(settings.telao.defaultDuration) || 15,
  }
}
