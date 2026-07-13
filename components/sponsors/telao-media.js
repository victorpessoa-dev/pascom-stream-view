'use client'

import { getDesignValue } from '@/lib/services/telao-player'

export default function TelaoMedia({ ad, design, onVideoEnded }) {
  const layoutEnabled = Boolean(design?.enabled)
  const width = getDesignValue(design, 'contentWidth', 'imageWidth', 100)
  const height = getDesignValue(design, 'contentHeight', 'imageHeight', 100)
  const x = getDesignValue(design, 'x', null, 50)
  const y = getDesignValue(design, 'y', null, 50)

  const mediaStyle = layoutEnabled
    ? {
      width: `${width}%`,
      height: `${height}%`,
      objectFit: design?.objectFit || 'contain',
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
    }
    : {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    }

  if (ad.mediaType === 'video') {
    return (
      <video
        key={ad.id}
        src={ad.src}
        className="block"
        style={mediaStyle}
        autoPlay
        muted
        playsInline
        onEnded={onVideoEnded}
      />
    )
  }

  return <img src={ad.src} alt={ad.name} className="block" style={mediaStyle} draggable={false} />
}
