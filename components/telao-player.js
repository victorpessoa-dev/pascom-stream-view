'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'

const ADS_CACHE_KEY = 'pascom:telao:ads-cache'
const LOG_QUEUE_KEY = 'pascom:telao:log-queue'
const ADS_REFRESH_INTERVAL_MS = 30 * 1000
const LOG_FLUSH_INTERVAL_MS = 2 * 60 * 1000
const emptySettings = {
  metricsEnabled: false,
  designs: {
    MASTER: {},
    NORMAL: {},
  },
}

function shuffleArray(items) {
  const cloned = [...items]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]]
  }
  return cloned
}

function getDesignValue(design, key, fallbackKey, defaultValue) {
  if (design?.[key] != null) return design[key]
  if (fallbackKey && design?.[fallbackKey] != null) return design[fallbackKey]
  return defaultValue
}

function SponsorMedia({ ad, design, onVideoEnded }) {
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

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ad.src} alt={ad.name} className="block" style={mediaStyle} draggable={false} />
}

function buildAdsSignature(items) {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      updatedAt: item.updatedAt || null,
      duration: item.duration,
      active: item.active,
      src: item.src,
      type: item.type,
    }))
  )
}

export default function TelaoPlayer({ kind = 'NORMAL', backgroundMode = 'auto' }) {
  const [ads, setAds] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sponsorSettings, setSponsorSettings] = useState(emptySettings)
  const [loaded, setLoaded] = useState(false)
  const [isOfflineCache, setIsOfflineCache] = useState(false)
  const adsRef = useRef([])
  const currentIndexRef = useRef(0)
  const refreshTimeoutRef = useRef(null)
  const lastSignatureRef = useRef('')
  const startTimeRef = useRef(Date.now())
  const flushTimerRef = useRef(null)
  const rotationTimerRef = useRef(null)

  useEffect(() => {
    adsRef.current = ads
  }, [ads])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  const preloadImages = useCallback((items) => {
    items
      .filter((item) => item.mediaType === 'image' && item.src)
      .forEach((item) => {
        const image = new Image()
        image.src = item.src
      })
  }, [])

  const enqueueLog = useCallback((log) => {
    const currentQueue = JSON.parse(localStorage.getItem(LOG_QUEUE_KEY) || '[]')
    currentQueue.push(log)
    localStorage.setItem(LOG_QUEUE_KEY, JSON.stringify(currentQueue))
  }, [])

  const registrarExibicao = useCallback(async (log) => {
    try {
      const response = await fetch('/api/anunciantes/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Falha ao registrar exibicao')
      }
    } catch {
      enqueueLog(log)
    }
  }, [enqueueLog])

  const flushLogQueue = useCallback(async () => {
    const queue = JSON.parse(localStorage.getItem(LOG_QUEUE_KEY) || '[]')
    if (queue.length === 0) return

    try {
      const response = await fetch('/api/anunciantes/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: queue }),
      })

      if (!response.ok) throw new Error('Falha ao reenviar fila')
      localStorage.removeItem(LOG_QUEUE_KEY)
    } catch {
      // Mantem a fila para nova tentativa.
    }
  }, [])

  const carregarAnuncios = useCallback(async () => {
    try {
      const response = await fetch('/api/ads-novenario', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Falha ao carregar anuncios')

      const filteredAds = (payload.ads || []).filter((ad) => ad.type === kind)
      const nextSignature = buildAdsSignature(filteredAds)
      const shouldShuffle = lastSignatureRef.current !== nextSignature
      const shuffledAds = shouldShuffle ? shuffleArray(filteredAds) : filteredAds
      const mergedSettings = payload.sponsorSettings || emptySettings
      const currentAds = adsRef.current
      const currentAd = currentAds[currentIndexRef.current] || currentAds[0] || null
      const preservedIndex = currentAd
        ? shuffledAds.findIndex((ad) => ad.id === currentAd.id)
        : -1

      setAds(shuffledAds)
      setSponsorSettings(mergedSettings)
      setCurrentIndex(preservedIndex >= 0 ? preservedIndex : 0)
      setIsOfflineCache(false)
      lastSignatureRef.current = nextSignature
      localStorage.setItem(
        `${ADS_CACHE_KEY}:${kind}`,
        JSON.stringify({
          ads: shuffledAds,
          sponsorSettings: mergedSettings,
          fetchedAt: payload.fetchedAt || new Date().toISOString(),
        })
      )
      preloadImages(shuffledAds)
    } catch {
      const cached = JSON.parse(localStorage.getItem(`${ADS_CACHE_KEY}:${kind}`) || 'null')
      if (cached?.ads?.length) {
        setAds(cached.ads)
        setSponsorSettings(cached.sponsorSettings || emptySettings)
        setCurrentIndex((prev) => Math.min(prev, Math.max(cached.ads.length - 1, 0)))
        setIsOfflineCache(true)
        lastSignatureRef.current = buildAdsSignature(cached.ads)
        preloadImages(cached.ads)
      }
    } finally {
      setLoaded(true)
    }
  }, [kind, preloadImages])

  const scheduleFastRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      if (navigator.onLine) {
        carregarAnuncios()
      }
    }, 200)
  }, [carregarAnuncios])

  const avancarAd = useCallback(async () => {
    if (ads.length === 0) return

    const currentAd = ads[currentIndex] || ads[0]
    const durationSeconds = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000))

    if (sponsorSettings.metricsEnabled) {
      await registrarExibicao({
        sponsorId: currentAd.id,
        displayedAt: new Date(startTimeRef.current).toISOString(),
        durationSeconds,
        source: 'telao',
      })
    }

    setCurrentIndex((prev) => (prev + 1) % ads.length)
    startTimeRef.current = Date.now()
  }, [ads, currentIndex, registrarExibicao, sponsorSettings.metricsEnabled])

  useEffect(() => {
    carregarAnuncios()
    flushLogQueue()

    const handleOnline = () => {
      carregarAnuncios()
      flushLogQueue()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        carregarAnuncios()
        flushLogQueue()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [carregarAnuncios, flushLogQueue])

  useEffect(() => {
    if (!loaded || ads.length === 0) return undefined

    const currentAd = ads[currentIndex] || ads[0]
    const duration = Math.max(3, Number(currentAd?.duration) || 10)
    startTimeRef.current = Date.now()

    rotationTimerRef.current = window.setTimeout(() => {
      avancarAd()
    }, duration * 1000)

    return () => {
      if (rotationTimerRef.current) window.clearTimeout(rotationTimerRef.current)
    }
  }, [ads, avancarAd, currentIndex, loaded])

  useEffect(() => {
    const adsRefreshTimer = window.setInterval(() => {
      if (navigator.onLine) carregarAnuncios()
    }, ADS_REFRESH_INTERVAL_MS)

    flushTimerRef.current = window.setInterval(() => {
      if (navigator.onLine) flushLogQueue()
    }, LOG_FLUSH_INTERVAL_MS)

    return () => {
      window.clearInterval(adsRefreshTimer)
      if (flushTimerRef.current) window.clearInterval(flushTimerRef.current)
      if (refreshTimeoutRef.current) window.clearTimeout(refreshTimeoutRef.current)
    }
  }, [carregarAnuncios, flushLogQueue])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`telao-live-${kind.toLowerCase()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, scheduleFastRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, scheduleFastRefresh)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [kind, scheduleFastRefresh])

  const currentAd = useMemo(() => ads[currentIndex] || ads[0], [ads, currentIndex])
  const design = currentAd ? sponsorSettings?.designs?.[currentAd.type] : null
  const emptyMessage = useMemo(() => {
    return {
      title: 'Nenhum patrocinador ativo',
    }
  }, [kind])
  const showBackground = useMemo(() => {
    if (!design?.backgroundEnabled || !design?.backgroundUrl) return false
    if (backgroundMode === 'always') return true
    if (backgroundMode === 'never') return false
    return true
  }, [backgroundMode, design?.backgroundEnabled, design?.backgroundUrl])

  if (!loaded) {
    return <div className="fixed inset-0 overflow-hidden bg-black" />
  }

  if (!currentAd) {
    return (
      <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black select-none" style={{ userSelect: 'none' }}>
        <div className="max-w-lg px-6 text-center">
          <div className="text-2xl font-semibold text-white">{emptyMessage.title}</div>
          <div className="mt-3 text-sm leading-6 text-white/65">{emptyMessage.description}</div>
          {isOfflineCache ? (
            <div className="mt-4 text-xs uppercase tracking-[0.18em] text-yellow-300/90">Sem anúncios ativos no cache local</div>
          ) : null}
        </div>
      </main>
    )
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-black select-none" style={{ userSelect: 'none' }}>
      {showBackground ? (
        <>
          <img
            src={design.backgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover select-none"
            draggable={false}
          />
          <div className="absolute inset-0">
            <SponsorMedia ad={currentAd} design={design} onVideoEnded={avancarAd} />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <SponsorMedia ad={currentAd} design={design} onVideoEnded={avancarAd} />
        </div>
      )}

      {isOfflineCache ? (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-100">
          Exibindo cache local
        </div>
      ) : null}
    </main>
  )
}
