export const OVERLAY_SELECT =
  "id, public_id, name, width, height, data, created_at, updated_at, church_id";

function assertChurchId(churchId, action) {
  if (!churchId) throw new Error(`Igreja obrigatória para ${action}`);
}

export async function listOverlays(supabase, churchId) {
  assertChurchId(churchId, "listar overlays");
  const { data, error } = await supabase
    .from("overlays")
    .select(OVERLAY_SELECT)
    .eq("church_id", churchId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function insertOverlay(supabase, payload, churchId) {
  assertChurchId(churchId, "criar overlays");
  const { data, error } = await supabase
    .from("overlays")
    .insert({ ...payload, church_id: churchId })
    .select(OVERLAY_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function updateOverlayById(supabase, id, payload, churchId) {
  assertChurchId(churchId, "atualizar overlays");
  // Verify ownership first
  const { data: overlay } = await supabase
    .from("overlays")
    .select("church_id")
    .eq("id", id)
    .single();

  if (!overlay || overlay.church_id !== churchId) {
    throw new Error("Overlay does not belong to this church");
  }

  const { data, error } = await supabase
    .from("overlays")
    .update(payload)
    .eq("id", id)
    .eq("church_id", churchId)
    .select(OVERLAY_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOverlayById(supabase, id, churchId) {
  assertChurchId(churchId, "excluir overlays");
  // Verify ownership first
  const { data: overlay } = await supabase
    .from("overlays")
    .select("church_id")
    .eq("id", id)
    .single();

  if (!overlay || overlay.church_id !== churchId) {
    throw new Error("Overlay does not belong to this church");
  }

  const { error } = await supabase
    .from("overlays")
    .delete()
    .eq("id", id)
    .eq("church_id", churchId);
  if (error) throw error;
}

export async function deleteAllOverlays(supabase, churchId) {
  assertChurchId(churchId, "excluir overlays");
  const { error } = await supabase
    .from("overlays")
    .delete()
    .eq("church_id", churchId);
  if (error) throw error;
}
