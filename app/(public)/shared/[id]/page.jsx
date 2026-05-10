'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'

function renderElement(element) {
  return (
    <div
      key={element.id}
      className="absolute bg-transparent"
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
          className="w-full h-full object-contain bg-transparent"
          draggable={false}
        />
      )}

      {element.type === 'text' && (
        <div
          className="w-full h-full flex items-center justify-center text-center bg-transparent"
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
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)

    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let cancelled = false

    const loadOverlay = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_overlay', {
          public_id_arg: publicId,
        })

        if (error) throw error
        if (cancelled) return

        const row = Array.isArray(data) ? data[0] : data
        setOverlay(row || null)
      } catch {
        if (!cancelled) {
          setOverlay(null)
        }
      } finally {
        if (!cancelled) {
          setLoaded(true)
        }
      }
    }

    loadOverlay()

    const channel = supabase
      .channel(`shared-overlay-${publicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'overlays',
        },
        () => {
          loadOverlay()
        }
      )
      .subscribe()

    const interval = setInterval(loadOverlay, 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [publicId])

  const elements = useMemo(() => {
    return [...(overlay?.data?.elements || [])]
      .filter((element) => element.visible !== false)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
  }, [overlay])

  const scale = overlay
    ? Math.min(
      viewport.width / Math.max(overlay.width || 1920, 1),
      viewport.height / Math.max(overlay.height || 1080, 1)
    )
    : 1

  if (!loaded || !overlay) {
    return <div className="fixed inset-0 bg-transparent overflow-hidden" />
  }

  return (
    <div
      data-overlay-transparent-root
      className="fixed inset-0 bg-transparent overflow-hidden flex items-center justify-center select-none pointer-events-none"
      style={{
        userSelect: 'none',
        background: 'transparent',
      }}
    >
      <div
        className="relative bg-transparent overflow-visible origin-center select-none"
        style={{
          width: overlay.width || 1920,
          height: overlay.height || 1080,
          transform: `scale(${scale})`,
          background: 'transparent',
        }}
      >
        {elements.map(renderElement)}
      </div>
    </div>
  )
}
