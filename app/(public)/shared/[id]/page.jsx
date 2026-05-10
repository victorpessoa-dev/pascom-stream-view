'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'

function renderElement(element) {
  return (
    <div
      key={element.id}
      className="absolute"
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
      }}
    >
      {element.type === 'image' && element.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={element.src} alt="" className="w-full h-full object-contain" draggable={false} />
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
  )
}

export default function PublicOverlayPage({ params }) {
  const { id: publicId } = use(params)
  const [overlay, setOverlay] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let cancelled = false

    const loadOverlay = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_overlay', { public_id_arg: publicId })
        if (error) throw error
        if (cancelled) return

        const row = Array.isArray(data) ? data[0] : data
        setOverlay(row || null)
        setLoadError(null)
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Falha ao carregar overlay')
        }
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadOverlay()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadOverlay()
      }
    }

    const channel = supabase
      .channel(`shared-overlay-${publicId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'overlays' }, () => {
        if (document.visibilityState === 'visible') {
          loadOverlay()
        }
      })
      .subscribe()

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadOverlay()
      }
    }, 1000)

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      supabase.removeChannel(channel)
    }
  }, [publicId])

  const elements = useMemo(
    () => [...(overlay?.data?.elements || [])]
      .filter((element) => element.visible !== false)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [overlay]
  )

  const scale = overlay
    ? Math.min(viewport.width / Math.max(overlay.width || 1, 1), viewport.height / Math.max(overlay.height || 1, 1))
    : 1

  if (!loaded) {
    return <div className="fixed inset-0 overflow-hidden bg-transparent" />
  }

  if (!overlay) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-transparent flex items-center justify-center">
        <div className="text-center p-6 bg-black/80 rounded-lg">
          <p className="text-white/70 text-lg">{loadError ? 'Falha ao carregar overlay' : 'Overlay não encontrado'}</p>
          <p className="text-white/40 text-sm mt-2">{loadError || `ID: ${publicId}`}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-transparent flex items-center justify-center select-none" style={{ userSelect: 'none' }}>
      <div
        className="relative overflow-hidden origin-center select-none"
        style={{
          width: overlay.width,
          height: overlay.height,
          transform: `scale(${scale})`,
        }}
      >
        {elements.map(renderElement)}
      </div>
    </div>
  )
}
