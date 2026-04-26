'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const StoreContext = createContext(null)

const STORAGE_KEY = 'streamoverlay_data'

const initialData = {
  overlays: [],
  ads: [],
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(initialData)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          setData(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse stored data:', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('streamoverlay_update', { detail: data }))
    }
  }, [data, isLoaded])

  // Overlay functions
  const createOverlay = useCallback((overlay) => {
    const newOverlay = {
      id: crypto.randomUUID(),
      name: overlay.name,
      width: overlay.width || 1920,
      height: overlay.height || 1080,
      elements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setData(prev => ({
      ...prev,
      overlays: [...prev.overlays, newOverlay]
    }))
    return newOverlay
  }, [])

  const updateOverlay = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      overlays: prev.overlays.map(o => 
        o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
      )
    }))
  }, [])

  const deleteOverlay = useCallback((id) => {
    setData(prev => ({
      ...prev,
      overlays: prev.overlays.filter(o => o.id !== id)
    }))
  }, [])

  const getOverlay = useCallback((id) => {
    return data.overlays.find(o => o.id === id)
  }, [data.overlays])

  // Element functions
  const addElement = useCallback((overlayId, element) => {
    const newElement = {
      id: crypto.randomUUID(),
      type: element.type || 'image',
      x: element.x || 0,
      y: element.y || 0,
      width: element.width || 200,
      height: element.height || 200,
      zIndex: element.zIndex || 1,
      visible: true,
      src: element.src || '',
      text: element.text || '',
      fontSize: element.fontSize || 24,
      fontColor: element.fontColor || '#ffffff',
      fontFamily: element.fontFamily || 'sans-serif',
      createdAt: new Date().toISOString(),
    }
    setData(prev => ({
      ...prev,
      overlays: prev.overlays.map(o => 
        o.id === overlayId 
          ? { ...o, elements: [...o.elements, newElement], updatedAt: new Date().toISOString() }
          : o
      )
    }))
    return newElement
  }, [])

  const updateElement = useCallback((overlayId, elementId, updates) => {
    setData(prev => ({
      ...prev,
      overlays: prev.overlays.map(o => 
        o.id === overlayId 
          ? {
              ...o,
              elements: o.elements.map(e => 
                e.id === elementId ? { ...e, ...updates } : e
              ),
              updatedAt: new Date().toISOString()
            }
          : o
      )
    }))
  }, [])

  const deleteElement = useCallback((overlayId, elementId) => {
    setData(prev => ({
      ...prev,
      overlays: prev.overlays.map(o => 
        o.id === overlayId 
          ? {
              ...o,
              elements: o.elements.filter(e => e.id !== elementId),
              updatedAt: new Date().toISOString()
            }
          : o
      )
    }))
  }, [])

  // Ad functions
  const createAd = useCallback((ad) => {
    const newAd = {
      id: crypto.randomUUID(),
      name: ad.name,
      type: ad.type || 'NORMAL',
      src: ad.src || '',
      duration: ad.duration || 10,
      active: true,
      createdAt: new Date().toISOString(),
    }
    setData(prev => ({
      ...prev,
      ads: [...prev.ads, newAd]
    }))
    return newAd
  }, [])

  const updateAd = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      ads: prev.ads.map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
    }))
  }, [])

  const deleteAd = useCallback((id) => {
    setData(prev => ({
      ...prev,
      ads: prev.ads.filter(a => a.id !== id)
    }))
  }, [])

  const value = {
    data,
    isLoaded,
    // Overlays
    overlays: data.overlays,
    createOverlay,
    updateOverlay,
    deleteOverlay,
    getOverlay,
    // Elements
    addElement,
    updateElement,
    deleteElement,
    // Ads
    ads: data.ads,
    createAd,
    updateAd,
    deleteAd,
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
