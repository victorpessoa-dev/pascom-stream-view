'use client'

import { use, useMemo } from 'react'
import { useStore } from '@/lib/store/store'

export default function OverlayPage({ params }) {
  const { id } = use(params)
  const { getOverlay, isLoaded } = useStore()
  const overlay = getOverlay(id)

  const elements = useMemo(
    () => [...(overlay?.elements || [])].filter((element) => element.visible).sort((a, b) => a.zIndex - b.zIndex),
    [overlay]
  )

  if (!isLoaded) {
    return <div className="fixed inset-0 overflow-hidden bg-transparent" />
  }

  if (!overlay) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-transparent flex items-center justify-center">
        <div className="text-center p-8 bg-black/80 rounded-lg">
          <p className="text-white/70 text-lg">Overlay não encontrado</p>
          <p className="text-white/40 text-sm mt-2">ID: {id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-transparent flex items-center justify-center">
      <div
        className="relative overflow-hidden"
        style={{
          width: overlay.width,
          height: overlay.height,
          transform: `scale(min(calc(100vw / ${overlay.width}), calc(100vh / ${overlay.height})))`,
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
            {element.type === 'image' && element.src && (
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
        ))}
      </div>
    </div>
  )
}
