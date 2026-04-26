'use client'

import { useState, useEffect, use } from 'react'

const STORAGE_KEY = 'streamoverlay_data'

export default function OverlayPage({ params }) {
  const resolvedParams = use(params)
  const [overlay, setOverlay] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load overlay data
  useEffect(() => {
    const loadOverlay = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const data = JSON.parse(stored)
            const found = data.overlays?.find(o => o.id === resolvedParams.id)
            setOverlay(found || null)
          } catch (e) {
            console.error('Failed to load overlay:', e)
          }
        }
        setIsLoaded(true)
      }
    }

    loadOverlay()

    // Listen for real-time updates (works within same tab)
    const handleUpdate = (event) => {
      const found = event.detail?.overlays?.find(o => o.id === resolvedParams.id)
      setOverlay(found || null)
    }

    // Poll for updates from other tabs/windows
    const interval = setInterval(loadOverlay, 500)
    
    window.addEventListener('streamoverlay_update', handleUpdate)
    window.addEventListener('storage', loadOverlay)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('streamoverlay_update', handleUpdate)
      window.removeEventListener('storage', loadOverlay)
    }
  }, [resolvedParams.id])

  // Don't render anything while loading (transparent for OBS)
  if (!isLoaded) {
    return (
      <div 
        style={{ 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: 'transparent' 
        }} 
      />
    )
  }

  // Show error state
  if (!overlay) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: '100vw', 
          height: '100vh',
          backgroundColor: 'transparent',
        }}
      >
        <div className="text-center p-8 bg-black/80 rounded-2xl">
          <p className="text-white/70 text-lg">Overlay nao encontrado</p>
          <p className="text-white/40 text-sm mt-2">ID: {resolvedParams.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative overflow-hidden"
      style={{ 
        width: overlay.width, 
        height: overlay.height,
        backgroundColor: 'transparent',
      }}
    >
      {/* Render all visible elements sorted by z-index */}
      {overlay.elements
        .filter(el => el.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => (
          <div
            key={element.id}
            className="absolute transition-all duration-150"
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              zIndex: element.zIndex,
            }}
          >
            {element.type === 'image' && element.src && (
              <img 
                src={element.src} 
                alt=""
                className="w-full h-full object-contain"
                draggable={false}
              />
            )}
            {element.type === 'text' && (
              <div 
                className="w-full h-full flex items-center justify-center text-center"
                style={{ 
                  fontSize: element.fontSize,
                  color: element.fontColor,
                  fontFamily: element.fontFamily,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  lineHeight: 1.2,
                }}
              >
                {element.text}
              </div>
            )}
          </div>
        ))}
    </div>
  )
}
