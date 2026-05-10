'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'

const StoreContext = createContext(null)

const defaultSponsorSettings = {
  metricsEnabled: false,
  designs: {
    MASTER: {
      enabled: false,
      backgroundEnabled: false,
      backgroundUrl: '',
      contentWidth: 72,
      contentHeight: 72,
      x: 50,
      y: 50,
      objectFit: 'contain',
    },
    NORMAL: {
      enabled: true,
      backgroundEnabled: false,
      backgroundUrl: '',
      contentWidth: 58,
      contentHeight: 58,
      x: 50,
      y: 50,
      objectFit: 'contain',
    },
  },
}

function mergeSponsorSettings(settings) {
  const masterSettings = settings?.designs?.MASTER || {}
  const normalSettings = settings?.designs?.NORMAL || {}

  return {
    ...defaultSponsorSettings,
    ...(settings || {}),
    designs: {
      MASTER: {
        ...defaultSponsorSettings.designs.MASTER,
        ...masterSettings,
        contentWidth: masterSettings.contentWidth ?? masterSettings.imageWidth ?? defaultSponsorSettings.designs.MASTER.contentWidth,
        contentHeight: masterSettings.contentHeight ?? masterSettings.imageHeight ?? defaultSponsorSettings.designs.MASTER.contentHeight,
      },
      NORMAL: {
        ...defaultSponsorSettings.designs.NORMAL,
        ...normalSettings,
        contentWidth: normalSettings.contentWidth ?? normalSettings.imageWidth ?? defaultSponsorSettings.designs.NORMAL.contentWidth,
        contentHeight: normalSettings.contentHeight ?? normalSettings.imageHeight ?? defaultSponsorSettings.designs.NORMAL.contentHeight,
      },
    },
  }
}

function notifyOverlayChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('streamoverlay_update'))
  }
}

function mapOverlay(row) {
  const data = row.data || {}

  return {
    id: row.id,
    publicId: row.public_id,
    name: row.name,
    width: row.width,
    height: row.height,
    elements: Array.isArray(data.elements) ? data.elements : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAd(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.kind,
    src: row.media_url || row.image_url || '',
    mediaType: row.media_type || 'image',
    sourceType: 'supabase',
    duration: row.duration_seconds || 10,
    active: row.active,
    views: row.views || 0,
    totalSeconds: row.total_seconds || 0,
    websiteUrl: row.website_url || '',
    lastDisplayedAt: row.last_displayed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function overlayPayload(overlay) {
  return {
    name: overlay.name,
    width: overlay.width || 1920,
    height: overlay.height || 1080,
    data: {
      elements: overlay.elements || [],
    },
    is_public: true,
  }
}

function sponsorPayload(ad) {
  return {
    name: ad.name,
    kind: ad.type || 'NORMAL',
    media_url: ad.src || '',
    image_url: ad.mediaType === 'image' ? ad.src || '' : null,
    media_type: ad.mediaType || 'image',
    website_url: ad.websiteUrl || null,
    duration_seconds: Math.max(3, Number(ad.duration) || 10),
    active: ad.active ?? true,
  }
}

export function StoreProvider({ children }) {
  const [overlays, setOverlays] = useState([])
  const [ads, setAds] = useState([])
  const [sponsorSettings, setSponsorSettings] = useState(defaultSponsorSettings)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()

      const [overlaysResult, sponsorsResult, settingsResult] = await Promise.all([
        supabase
          .from('overlays')
          .select('id, public_id, name, width, height, data, created_at, updated_at')
          .order('updated_at', { ascending: false }),
        supabase
          .from('sponsors')
          .select('id, name, kind, media_url, media_type, image_url, website_url, duration_seconds, active, views, total_seconds, last_displayed_at, created_at, updated_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'sponsor_settings')
          .maybeSingle(),
      ])

      if (overlaysResult.error) throw overlaysResult.error
      if (sponsorsResult.error) throw sponsorsResult.error
      if (settingsResult.error) throw settingsResult.error

      setOverlays((overlaysResult.data || []).map(mapOverlay))
      setAds((sponsorsResult.data || []).map(mapAd))
      setSponsorSettings(mergeSponsorSettings(settingsResult.data?.value))
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
    const payload = overlayPayload({
      ...overlay,
      elements: [],
    })

    const { data, error: requestError } = await supabase
      .from('overlays')
      .insert(payload)
      .select('id, public_id, name, width, height, data, created_at, updated_at')
      .single()

    if (requestError) throw requestError

    const newOverlay = mapOverlay(data)
    setOverlays((prev) => [newOverlay, ...prev])
    notifyOverlayChange()
    return newOverlay
  }, [])

  const updateOverlay = useCallback(async (id, updates) => {
    const current = overlays.find((overlay) => overlay.id === id)
    if (!current) return null

    const updated = { ...current, ...updates }
    const supabase = createSupabaseBrowserClient()

    const { data, error: requestError } = await supabase
      .from('overlays')
      .update(overlayPayload(updated))
      .eq('id', id)
      .select('id, public_id, name, width, height, data, created_at, updated_at')
      .single()

    if (requestError) throw requestError

    const mapped = mapOverlay(data)
    setOverlays((prev) => prev.map((overlay) => (overlay.id === id ? mapped : overlay)))
    notifyOverlayChange()
    return mapped
  }, [overlays])

  const deleteOverlay = useCallback(async (id) => {
    const supabase = createSupabaseBrowserClient()
    const { error: requestError } = await supabase.from('overlays').delete().eq('id', id)
    if (requestError) throw requestError
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
    const { data, error: requestError } = await supabase
      .from('sponsors')
      .insert(sponsorPayload(ad))
      .select('id, name, kind, media_url, media_type, image_url, website_url, duration_seconds, active, views, total_seconds, last_displayed_at, created_at, updated_at')
      .single()

    if (requestError) throw requestError

    const newAd = mapAd(data)
    setAds((prev) => [newAd, ...prev])
    return newAd
  }, [])

  const updateAd = useCallback(async (id, updates) => {
    const current = ads.find((ad) => ad.id === id)
    if (!current) return

    const supabase = createSupabaseBrowserClient()
    const { data, error: requestError } = await supabase
      .from('sponsors')
      .update(sponsorPayload({ ...current, ...updates }))
      .eq('id', id)
      .select('id, name, kind, media_url, media_type, image_url, website_url, duration_seconds, active, views, total_seconds, last_displayed_at, created_at, updated_at')
      .single()

    if (requestError) throw requestError

    const mapped = mapAd(data)
    setAds((prev) => prev.map((ad) => (ad.id === id ? mapped : ad)))
  }, [ads])

  const deleteAd = useCallback(async (id) => {
    const supabase = createSupabaseBrowserClient()
    const { error: requestError } = await supabase.from('sponsors').delete().eq('id', id)
    if (requestError) throw requestError
    setAds((prev) => prev.filter((ad) => ad.id !== id))
  }, [])

  const recordAdView = useCallback(async (id, seconds = 0) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0)
    const supabase = createSupabaseBrowserClient()
    const { error: requestError } = await supabase.rpc('record_sponsor_view', {
      sponsor_id: id,
      seconds: safeSeconds,
    })

    if (requestError) throw requestError

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
    const { error: requestError } = await supabase
      .from('app_settings')
      .upsert({ key: 'sponsor_settings', value: merged }, { onConflict: 'key' })

    if (requestError) {
      setSponsorSettings(previous)
      throw requestError
    }
  }, [sponsorSettings])

  const value = {
    data: { overlays, ads, sponsorSettings },
    error,
    isLoaded,
    overlays,
    ads,
    sponsorSettings,
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
