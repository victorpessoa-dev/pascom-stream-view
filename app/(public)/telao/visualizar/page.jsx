'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'streamoverlay_data'

export default function TelaoPage() {
  const [ads, setAds] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [progress, setProgress] = useState(0)

  const loadAds = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          const activeAds = (data.ads || [])
            .filter(ad => ad.active)
            .sort((a, b) => {
              if (a.type === 'MASTER' && b.type !== 'MASTER') return -1
              if (a.type !== 'MASTER' && b.type === 'MASTER') return 1
              return 0
            })
          setAds(activeAds)
        } catch (e) {
          console.error('Failed to load ads:', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadAds()

    const handleUpdate = (event) => {
      const activeAds = (event.detail?.ads || [])
        .filter(ad => ad.active)
        .sort((a, b) => {
          if (a.type === 'MASTER' && b.type !== 'MASTER') return -1
          if (a.type !== 'MASTER' && b.type === 'MASTER') return 1
          return 0
        })
      setAds(activeAds)
    }

    const pollInterval = setInterval(loadAds, 2000)
    
    window.addEventListener('streamoverlay_update', handleUpdate)
    window.addEventListener('storage', loadAds)
    
    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('streamoverlay_update', handleUpdate)
      window.removeEventListener('storage', loadAds)
    }
  }, [loadAds])

  // Auto-rotate ads with smooth transitions
  useEffect(() => {
    if (ads.length === 0) return

    const currentAd = ads[currentIndex]
    if (!currentAd) {
      setCurrentIndex(0)
      return
    }

    const duration = (currentAd.duration || 10) * 1000
    
    // Reset progress
    setProgress(0)
    
    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = 100 / (duration / 50)
        return Math.min(100, prev + increment)
      })
    }, 50)

    const timeout = setTimeout(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length)
        setIsTransitioning(false)
      }, 500)
    }, duration)

    return () => {
      clearTimeout(timeout)
      clearInterval(progressInterval)
    }
  }, [ads, currentIndex])

  // Reset index if ads change
  useEffect(() => {
    if (currentIndex >= ads.length && ads.length > 0) {
      setCurrentIndex(0)
    }
  }, [ads, currentIndex])

  if (!isLoaded) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white/60 text-lg font-light">Nenhuma propaganda ativa</p>
          <p className="text-white/30 text-sm mt-2">Adicione propagandas no painel admin para exibir aqui</p>
        </div>
      </div>
    )
  }

  const currentAd = ads[currentIndex]

  if (!currentAd) {
    return null
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Background blur effect */}
      <div 
        className="absolute inset-0 scale-110 blur-3xl opacity-30"
        style={{
          backgroundImage: `url(${currentAd.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Main content */}
      <div 
        className={`relative w-full h-full transition-all duration-500 ease-out ${
          isTransitioning 
            ? 'opacity-0 scale-105' 
            : 'opacity-100 scale-100'
        }`}
      >
        <img 
          src={currentAd.src} 
          alt={currentAd.name}
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Progress indicators */}
      <div className="absolute bottom-6 left-6 right-6 flex gap-2">
        {ads.map((ad, index) => (
          <div
            key={ad.id}
            className={`h-1.5 flex-1 rounded-full overflow-hidden transition-all duration-300 ${
              index === currentIndex ? 'bg-white/30' : 'bg-white/10'
            }`}
          >
            {index === currentIndex && (
              <div 
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            )}
            {index < currentIndex && (
              <div className="h-full bg-white/50 rounded-full w-full" />
            )}
          </div>
        ))}
      </div>

      {/* Ad info overlay */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        {currentAd.type === 'MASTER' && (
          <div className="bg-yellow-500 text-yellow-950 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
            MASTER
          </div>
        )}
        <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium">
          {currentIndex + 1} / {ads.length}
        </div>
      </div>

      {/* Duration indicator */}
      <div className="absolute top-6 right-6">
        <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {currentAd.duration}s
        </div>
      </div>

      {/* Subtle branding */}
      <div className="absolute bottom-6 right-6">
        <div className="text-white/20 text-xs font-light">
          Pascom Stream View
        </div>
      </div>
    </div>
  )
}
