"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { buildOverlayPayload, mapOverlayRow } from "@/lib/mappers/overlays";
import { mapSponsorStoreRow } from "@/lib/mappers/sponsors";
import {
  defaultAdminSettings,
  defaultSponsorSettings,
  mergeAdminSettings,
  mergeSponsorSettings,
} from "@/lib/mappers/settings";
import {
  deleteOverlayById,
  insertOverlay,
  listOverlays,
  updateOverlayById,
} from "@/lib/repositories/overlays";
import { deleteSponsorById, listSponsors } from "@/lib/repositories/sponsors";
import {
  createSponsorForAdmin,
  updateSponsorForAdmin,
} from "@/lib/services/sponsors";
import { getAppSetting, upsertAppSetting } from "@/lib/repositories/settings";
import { createSupabaseBrowserClient } from "@/services/supabase/browser";
import { deleteUploadedMediaBatch } from "@/services/supabase/upload";

const StoreContext = createContext(null);

function notifyOverlayChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("streamoverlay_update"));
  }
}

export function StoreProvider({ children }) {
  const [overlays, setOverlays] = useState([]);
  const [ads, setAds] = useState([]);
  const [sponsorSettings, setSponsorSettings] = useState(
    defaultSponsorSettings,
  );
  const [adminSettings, setAdminSettings] = useState(defaultAdminSettings);
  const [churchId, setChurchId] = useState("");
  const [churchSlug, setChurchSlug] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão administrativa não encontrada");

      const { data: church, error: associationError } = await supabase
        .from("churches")
        .select("id, slug")
        .eq("admin_id", user.id)
        .maybeSingle();

      if (associationError) throw associationError;
      if (!church?.id) throw new Error("Nenhuma igreja vinculada a esta conta");
      setChurchId(church.id);
      setChurchSlug(church.slug || "");

      const [
        overlayRows,
        sponsorRows,
        sponsorSettingsValue,
        adminSettingsValue,
      ] = await Promise.all([
        listOverlays(supabase, church.id),
        listSponsors(supabase, church.id),
        getAppSetting(supabase, "sponsor_settings", church.id),
        getAppSetting(supabase, "admin_settings", church.id),
      ]);

      setOverlays(overlayRows.map(mapOverlayRow));
      setAds(sponsorRows.map(mapSponsorStoreRow));
      setSponsorSettings(mergeSponsorSettings(sponsorSettingsValue));
      setAdminSettings(mergeAdminSettings(adminSettingsValue));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha ao carregar dados do Supabase",
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createOverlay = useCallback(
    async (overlay) => {
      const supabase = createSupabaseBrowserClient();
      const payload = buildOverlayPayload({
        ...overlay,
        elements: [],
      });

      const newOverlay = mapOverlayRow(
        await insertOverlay(supabase, payload, churchId),
      );
      setOverlays((prev) => [newOverlay, ...prev]);
      notifyOverlayChange();
      return newOverlay;
    },
    [churchId],
  );

  const updateOverlay = useCallback(
    async (id, updates) => {
      const current = overlays.find((overlay) => overlay.id === id);
      if (!current) return null;

      const updated = { ...current, ...updates };
      const supabase = createSupabaseBrowserClient();

      const mapped = mapOverlayRow(
        await updateOverlayById(
          supabase,
          id,
          buildOverlayPayload(updated),
          churchId,
        ),
      );
      setOverlays((prev) =>
        prev.map((overlay) => (overlay.id === id ? mapped : overlay)),
      );
      notifyOverlayChange();
      return mapped;
    },
    [churchId, overlays],
  );

  const deleteOverlay = useCallback(
    async (id) => {
      const overlay = overlays.find((item) => item.id === id);
      const supabase = createSupabaseBrowserClient();
      await deleteOverlayById(supabase, id, churchId);
      setOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
      notifyOverlayChange();
      return {
        storageErrors: await deleteUploadedMediaBatch(
          overlay?.elements?.map((element) => element.src) || [],
        ),
      };
    },
    [churchId, overlays],
  );

  const getOverlay = useCallback(
    (id) => overlays.find((overlay) => overlay.id === id),
    [overlays],
  );

  const addElement = useCallback(
    async (overlayId, element) => {
      const overlay = overlays.find((item) => item.id === overlayId);
      if (!overlay) return null;

      const newElement = {
        id: crypto.randomUUID(),
        type: element.type || "image",
        x: element.x || 0,
        y: element.y || 0,
        width: element.width || 200,
        height: element.height || 200,
        zIndex: element.zIndex || 1,
        visible: element.visible ?? true,
        src: element.src || "",
        text: element.text || "",
        fontSize: element.fontSize || 24,
        fontColor: element.fontColor || "#ffffff",
        fontFamily: element.fontFamily || "sans-serif",
        createdAt: new Date().toISOString(),
      };

      await updateOverlay(overlayId, {
        elements: [...overlay.elements, newElement],
      });

      return newElement;
    },
    [overlays, updateOverlay],
  );

  const updateElement = useCallback(
    async (overlayId, elementId, updates) => {
      const overlay = overlays.find((item) => item.id === overlayId);
      if (!overlay) return;

      const previousElements = overlay.elements;
      const nextElements = overlay.elements.map((element) =>
        element.id === elementId ? { ...element, ...updates } : element,
      );

      setOverlays((prev) =>
        prev.map((item) =>
          item.id === overlayId ? { ...item, elements: nextElements } : item,
        ),
      );

      try {
        await updateOverlay(overlayId, { elements: nextElements });
      } catch (error) {
        setOverlays((prev) =>
          prev.map((item) =>
            item.id === overlayId
              ? { ...item, elements: previousElements }
              : item,
          ),
        );
        throw error;
      }
    },
    [overlays, updateOverlay],
  );

  const deleteElement = useCallback(
    async (overlayId, elementId) => {
      const overlay = overlays.find((item) => item.id === overlayId);
      if (!overlay) return;

      const element = overlay.elements.find((item) => item.id === elementId);

      await updateOverlay(overlayId, {
        elements: overlay.elements.filter(
          (element) => element.id !== elementId,
        ),
      });
      return {
        storageErrors: await deleteUploadedMediaBatch([element?.src]),
      };
    },
    [overlays, updateOverlay],
  );

  const createAd = useCallback(
    async (ad) => {
      const supabase = createSupabaseBrowserClient();
      const newAd = await createSponsorForAdmin(supabase, ad, churchId);
      setAds((prev) => [newAd, ...prev]);
      return newAd;
    },
    [churchId],
  );

  const updateAd = useCallback(
    async (id, updates) => {
      const current = ads.find((ad) => ad.id === id);
      if (!current) throw new Error("Patrocínio não encontrado para atualizar");

      const supabase = createSupabaseBrowserClient();
      const mapped = await updateSponsorForAdmin(
        supabase,
        current,
        updates,
        churchId,
      );
      setAds((prev) => prev.map((ad) => (ad.id === id ? mapped : ad)));
      return mapped;
    },
    [ads, churchId],
  );

  const deleteAd = useCallback(
    async (id) => {
      const ad = ads.find((item) => item.id === id);
      const supabase = createSupabaseBrowserClient();
      await deleteSponsorById(supabase, id, churchId);
      setAds((prev) => prev.filter((ad) => ad.id !== id));
      return {
        storageErrors: await deleteUploadedMediaBatch([ad?.src]),
      };
    },
    [ads, churchId],
  );

  const updateSponsorSettings = useCallback(
    async (updates) => {
      const previous = sponsorSettings;
      const merged = mergeSponsorSettings({
        ...sponsorSettings,
        ...updates,
        designs: {
          ...sponsorSettings.designs,
          ...(updates.designs || {}),
        },
      });

      setSponsorSettings(merged);

      const supabase = createSupabaseBrowserClient();
      try {
        await upsertAppSetting(supabase, "sponsor_settings", merged, churchId);
      } catch (requestError) {
        setSponsorSettings(previous);
        throw requestError;
      }
    },
    [churchId, sponsorSettings],
  );

  const value = {
    data: { overlays, ads, sponsorSettings, adminSettings },
    error,
    isLoaded,
    overlays,
    ads,
    sponsorSettings,
    adminSettings,
    churchId,
    churchSlug,
    reload: loadData,
    createOverlay,
    updateOverlay,
    deleteOverlay,
    getOverlay,
    addElement,
    updateElement,
    deleteElement,
    createAd,
    updateAd,
    deleteAd,
    updateSponsorSettings,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
