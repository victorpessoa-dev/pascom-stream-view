'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { buildOverlayPayload, mapOverlayRow } from '@/lib/mappers/overlays'
import { mapSponsorStoreRow } from '@/lib/mappers/sponsors'
import {
  defaultAdminSettings,
  defaultSponsorSettings,
  mergeAdminSettings,
  mergeSponsorSettings,
} from '@/lib/mappers/settings'
import {
  deleteOverlayById,
  insertOverlay,
  listOverlays,
  updateOverlayById,
} from '@/lib/repositories/overlays'
import {
  deleteSponsorById,
  listSponsors,
  recordSponsorView,
} from '@/lib/repositories/sponsors'
import { createSponsorForAdmin, updateSponsorForAdmin } from '@/lib/services/sponsors'
import { getAppSetting, upsertAppSetting } from '@/lib/repositories/settings'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'

const StoreContext = createContext(null)

function notifyOverlayChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('streamoverlay_update'))
  }
}

export function StoreProvider({ children }) {
  const [overlays, setOverlays] = useState([])
  const [ads, setAds] = useState([])
  const [sponsorSettings, setSponsorSettings] = useState(defaultSponsorSettings)
  const [adminSettings, setAdminSettings] = useState(defaultAdminSettings)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()

      const [overlayRows, sponsorRows, sponsorSettingsValue, adminSettingsValue] = await Promise.all([
        listOverlays(supabase),
        listSponsors(supabase),
        getAppSetting(supabase, 'sponsor_settings'),
        getAppSetting(supabase, 'admin_settings'),
      ])

      setOverlays(overlayRows.map(mapOverlayRow))
      setAds(sponsorRows.map(mapSponsorStoreRow))
      setSponsorSettings(mergeSponsorSettings(sponsorSettingsValue))
      setAdminSettings(mergeAdminSettings(adminSettingsValue))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados do Supabase')
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const createOverlay = useCallback(async (overlay) => {
    const supabase = createSupabaseBrowserClient()
    const payload = buildOverlayPayload({
      ...overlay,
      elements: [],
    })

    const newOverlay = mapOverlayRow(await insertOverlay(supabase, payload))
    setOverlays((prev) => [newOverlay, ...prev])
    notifyOverlayChange()
    return newOverlay
  }, [])

  const updateOverlay = useCallback(async (id, updates) => {
    const current = overlays.find((overlay) => overlay.id === id)
    if (!current) return null

    const updated = { ...current, ...updates }
    const supabase = createSupabaseBrowserClient()

    const mapped = mapOverlayRow(await updateOverlayById(supabase, id, buildOverlayPayload(updated)))
    setOverlays((prev) => prev.map((overlay) => (overlay.id === id ? mapped : overlay)))
    notifyOverlayChange()
    return mapped
  }, [overlays])

  const deleteOverlay = useCallback(async (id) => {
    const supabase = createSupabaseBrowserClient()
    await deleteOverlayById(supabase, id)
    setOverlays((prev) => prev.filter((overlay) => overlay.id !== id))
    notifyOverlayChange()
  }, [])

  const getOverlay = useCallback((id) => overlays.find((overlay) => overlay.id === id), [overlays])

  const addElement = useCallback(async (overlayId, element) => {
    const overlay = overlays.find((item) => item.id === overlayId)
    if (!overlay) return null

    const newElement = {
      id: crypto.randomUUID(),
      type: element.type || 'image',
      x: element.x || 0,
      y: element.y || 0,
      width: element.width || 200,
      height: element.height || 200,
      zIndex: element.zIndex || 1,
      visible: element.visible ?? true,
      src: element.src || '',
      text: element.text || '',
      fontSize: element.fontSize || 24,
      fontColor: element.fontColor || '#ffffff',
      fontFamily: element.fontFamily || 'sans-serif',
      createdAt: new Date().toISOString(),
    }

    await updateOverlay(overlayId, {
      elements: [...overlay.elements, newElement],
    })

    return newElement
  }, [overlays, updateOverlay])

  const updateElement = useCallback(async (overlayId, elementId, updates) => {
    const overlay = overlays.find((item) => item.id === overlayId)
    if (!overlay) return

    const previousElements = overlay.elements
    const nextElements = overlay.elements.map((element) =>
      element.id === elementId ? { ...element, ...updates } : element
    )

    setOverlays((prev) => prev.map((item) => (
      item.id === overlayId ? { ...item, elements: nextElements } : item
    )))

    try {
      await updateOverlay(overlayId, { elements: nextElements })
    } catch (error) {
      setOverlays((prev) => prev.map((item) => (
        item.id === overlayId ? { ...item, elements: previousElements } : item
      )))
      throw error
    }
  }, [overlays, updateOverlay])

  const deleteElement = useCallback(async (overlayId, elementId) => {
    const overlay = overlays.find((item) => item.id === overlayId)
    if (!overlay) return

    await updateOverlay(overlayId, {
      elements: overlay.elements.filter((element) => element.id !== elementId),
    })
  }, [overlays, updateOverlay])

  const createAd = useCallback(async (ad) => {
    const supabase = createSupabaseBrowserClient()
    const newAd = await createSponsorForAdmin(supabase, ad)
    setAds((prev) => [newAd, ...prev])
    return newAd
  }, [])

  const updateAd = useCallback(async (id, updates) => {
    const current = ads.find((ad) => ad.id === id)
    if (!current) throw new Error('Patrocínio não encontrado para atualizar')

    const supabase = createSupabaseBrowserClient()
    const mapped = await updateSponsorForAdmin(supabase, current, updates)
    setAds((prev) => prev.map((ad) => (ad.id === id ? mapped : ad)))
    return mapped
  }, [ads])

  const deleteAd = useCallback(async (id) => {
    const supabase = createSupabaseBrowserClient()
    await deleteSponsorById(supabase, id)
    setAds((prev) => prev.filter((ad) => ad.id !== id))
  }, [])

  const recordAdView = useCallback(async (id, seconds = 0) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0)
    const supabase = createSupabaseBrowserClient()
    await recordSponsorView(supabase, id, safeSeconds)

    setAds((prev) => prev.map((ad) => (
      ad.id === id
        ? {
            ...ad,
            views: (ad.views || 0) + 1,
            totalSeconds: (ad.totalSeconds || 0) + safeSeconds,
          }
        : ad
    )))
  }, [])

  const updateSponsorSettings = useCallback(async (updates) => {
    const previous = sponsorSettings
    const merged = mergeSponsorSettings({
      ...sponsorSettings,
      ...updates,
      designs: {
        ...sponsorSettings.designs,
        ...(updates.designs || {}),
      },
    })

    setSponsorSettings(merged)

    const supabase = createSupabaseBrowserClient()
    try {
      await upsertAppSetting(supabase, 'sponsor_settings', merged)
    } catch (requestError) {
      setSponsorSettings(previous)
      throw requestError
    }
  }, [sponsorSettings])

  const value = {
    data: { overlays, ads, sponsorSettings, adminSettings },
    error,
    isLoaded,
    overlays,
    ads,
    sponsorSettings,
    adminSettings,
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
    recordAdView,
    updateSponsorSettings,
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
