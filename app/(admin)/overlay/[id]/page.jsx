'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store/store'

const OVERLAY_WIDTH = 1920
const OVERLAY_HEIGHT = 1080

export default function OverlayPage({ params }) {
  const { id } = use(params)
  const { getOverlay, isLoaded } = useStore()
  const overlay = getOverlay(id)
  const [viewport, setViewport] = useState({ width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT })

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  const elements = useMemo(
    () => [...(overlay?.elements || [])].filter((element) => element.visible).sort((a, b) => a.zIndex - b.zIndex),
    [overlay]
  )

  if (!isLoaded) {
    return <div data-overlay-transparent-root className="fixed inset-0 overflow-hidden bg-transparent" />
  }

  if (!overlay) {
    return (
      <div data-overlay-transparent-root className="fixed inset-0 overflow-hidden bg-transparent flex items-center justify-center">
        <div className="text-center p-8 bg-black/80 rounded-lg">
          <p className="text-white/70 text-lg">Overlay não encontrado</p>
          <p className="text-white/40 text-sm mt-2">ID: {id}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      data-overlay-transparent-root
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-transparent pointer-events-none select-none"
      style={{ background: 'transparent', userSelect: 'none' }}
    >
      <div
        className="relative origin-center overflow-hidden bg-transparent"
        style={{
          width: OVERLAY_WIDTH,
          height: OVERLAY_HEIGHT,
          transform: `scale(${Math.min(viewport.width / OVERLAY_WIDTH, viewport.height / OVERLAY_HEIGHT)})`,
          background: 'transparent',
        }}
      >
        {elements.map((element) => (
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
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute"
                style={{
                  left: -(element.cropLeft || 0),
                  top: -(element.cropTop || 0),
                  width: element.width + (element.cropLeft || 0) + (element.cropRight || 0),
                  height: element.height + (element.cropTop || 0) + (element.cropBottom || 0),
                }}
              >
                {element.type === 'image' && element.src ? <img src={element.src} alt="" className="h-full w-full object-contain" draggable={false} /> : null}
                {element.type === 'text' ? (
                  <div className="flex h-full w-full items-center justify-center text-center" style={{ fontSize: element.fontSize, color: element.fontColor, fontFamily: element.fontFamily, textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: 1.2 }}>
                    {element.text}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
