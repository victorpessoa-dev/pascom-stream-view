'use client'

import { useEffect, useState } from 'react'
import { getDesignValue } from '@/lib/services/telao-player'

const DEFAULT_MEDIA_BACKGROUND = '#050505'

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function rgbToHsl(red, green, blue) {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2

  if (max === min) {
    return { saturation: 0, lightness }
  }

  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  return { saturation, lightness }
}

function getDominantColorFromCanvas(source) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return DEFAULT_MEDIA_BACKGROUND

  canvas.width = 48
  canvas.height = 48
  context.drawImage(source, 0, 0, canvas.width, canvas.height)

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  const buckets = new Map()

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]
    if (alpha < 24) continue

    const red = data[index]
    const green = data[index + 1]
    const blue = data[index + 2]
    const { saturation, lightness } = rgbToHsl(red, green, blue)

    if (lightness < 0.04 || lightness > 0.96) continue

    const bucketRed = Math.round(red / 24) * 24
    const bucketGreen = Math.round(green / 24) * 24
    const bucketBlue = Math.round(blue / 24) * 24
    const key = `${bucketRed},${bucketGreen},${bucketBlue}`
    const weight = 1 + saturation * 3 + (1 - Math.abs(lightness - 0.5) * 2)
    const bucket = buckets.get(key) || { red: 0, green: 0, blue: 0, score: 0, count: 0 }

    bucket.red += red * weight
    bucket.green += green * weight
    bucket.blue += blue * weight
    bucket.score += weight
    bucket.count += 1
    buckets.set(key, bucket)
  }

  if (buckets.size === 0) {
    return DEFAULT_MEDIA_BACKGROUND
  }

  const dominant = [...buckets.values()].sort((a, b) => {
    const scoreDiff = b.score - a.score
    return Math.abs(scoreDiff) > 0.001 ? scoreDiff : b.count - a.count
  })[0]

  return `rgb(${clampColor(dominant.red / dominant.score)}, ${clampColor(dominant.green / dominant.score)}, ${clampColor(dominant.blue / dominant.score)})`
}

function useMediaBackgroundColor(src, mediaType) {
  const [color, setColor] = useState(DEFAULT_MEDIA_BACKGROUND)

  useEffect(() => {
    if (!src) {
      setColor(DEFAULT_MEDIA_BACKGROUND)
      return undefined
    }

    let cancelled = false

    if (mediaType === 'video') {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.muted = true
      video.playsInline = true
      video.preload = 'metadata'
      video.src = src

      const capture = () => {
        if (cancelled || video.videoWidth === 0 || video.videoHeight === 0) return
        try {
          setColor(getDominantColorFromCanvas(video))
        } catch {
          setColor(DEFAULT_MEDIA_BACKGROUND)
        }
      }

      video.addEventListener('loadeddata', capture, { once: true })
      video.load()

      return () => {
        cancelled = true
        video.removeEventListener('loadeddata', capture)
        video.removeAttribute('src')
        video.load()
      }
    }

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      if (cancelled) return
      try {
        setColor(getDominantColorFromCanvas(image))
      } catch {
        setColor(DEFAULT_MEDIA_BACKGROUND)
      }
    }
    image.onerror = () => {
      if (!cancelled) setColor(DEFAULT_MEDIA_BACKGROUND)
    }
    image.src = src

    return () => {
      cancelled = true
    }
  }, [mediaType, src])

  return color
}

export default function TelaoMedia({ ad, design, onVideoEnded }) {
  const backgroundColor = useMediaBackgroundColor(ad?.src, ad?.mediaType)
  const layoutEnabled = Boolean(design?.enabled)
  const width = getDesignValue(design, 'contentWidth', 'imageWidth', 100)
  const height = getDesignValue(design, 'contentHeight', 'imageHeight', 100)
  const x = getDesignValue(design, 'x', null, 50)
  const y = getDesignValue(design, 'y', null, 50)
  const objectFit = design?.objectFit || 'contain'

  const frameStyle = layoutEnabled
    ? {
      width: `${width}%`,
      height: `${height}%`,
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      backgroundColor,
      backgroundImage: `radial-gradient(circle at center, color-mix(in srgb, ${backgroundColor} 82%, white 18%), ${backgroundColor})`,
    }
    : {
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor,
      backgroundImage: `radial-gradient(circle at center, color-mix(in srgb, ${backgroundColor} 82%, white 18%), ${backgroundColor})`,
    }

  const mediaStyle = {
    width: '100%',
    height: '100%',
    objectFit: layoutEnabled ? objectFit : 'contain',
  }

  return (
    <div className="overflow-hidden" style={frameStyle}>
      {ad.mediaType === 'video' ? (
        <video
          key={ad.id}
          src={ad.src}
          className="relative block"
          style={mediaStyle}
          autoPlay
          muted
          playsInline
          onEnded={onVideoEnded}
        />
      ) : (
        <img src={ad.src} alt={ad.name} className="relative block" style={mediaStyle} draggable={false} />
      )}
    </div>
  )
}
