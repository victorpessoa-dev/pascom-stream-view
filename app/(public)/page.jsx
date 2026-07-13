'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Church, Clock, Eye, ExternalLink, MapPin, Megaphone, Play, RefreshCw, Search, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import AppFooter from '@/components/shared/app-footer'
import PaginationControls from '@/components/shared/pagination-controls'
import PageContainer from '@/components/layout/page-container'
import LoadingState from '@/components/shared/loading-state'
import StaticMediaFrame from '@/components/shared/static-media-frame'
import { normalizeSocialLinks } from '@/components/shared/social-links'
import { isSafePublicUrl } from '@/lib/utils/url'

const PUBLIC_PAGE_SIZE = 12

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`
}

function Media({ ad, className = '', staticFrame = false }) {
  if (staticFrame) {
    return <StaticMediaFrame src={ad.src} alt={ad.name} type={ad.mediaType || 'image'} className={className} />
  }

  if (ad.mediaType === 'video') {
    return <video src={ad.src} className={className} muted playsInline autoPlay loop />
  }

  return <img src={ad.src} alt={ad.name} className={className} />
}

export default function PublicDashboardPage() {
  const [slideIndex, setSlideIndex] = useState(0)
  const [activeSponsors, setActiveSponsors] = useState([])
  const [advertisers, setAdvertisers] = useState([])
  const [parishInfo, setParishInfo] = useState({
    parishName: '',
    parishCity: '',
    parishProfile: '',
    parishLogoUrl: '',
    parishCoverUrl: '',
    parishInstagramUrl: '',
    parishFacebookUrl: '',
    parishYoutubeUrl: '',
    parishWhatsappUrl: '',
    parishWebsiteUrl: '',
    parishSocialLinks: [],
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showParishNav, setShowParishNav] = useState(false)
  const parishProfileRef = useRef(null)

  const current = activeSponsors[slideIndex] || activeSponsors[0]
  const parishSocialLinks = useMemo(() => normalizeSocialLinks(parishInfo), [parishInfo])

  const filteredAdvertisers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return advertisers

    return advertisers.filter((ad) =>
      [ad.name, ad.type, ad.websiteUrl]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [advertisers, searchTerm])

  const publicStats = useMemo(() => {
    const items = filteredAdvertisers.length > 0 || searchTerm ? filteredAdvertisers : advertisers

    return {
      totalSponsors: items.length,
      totalDuration: items.reduce((sum, ad) => sum + Math.max(0, Number(ad.duration) || 0), 0),
      totalViews: items.reduce((sum, ad) => sum + (ad.views || 0), 0),
      totalViewedSeconds: items.reduce((sum, ad) => sum + (ad.totalSeconds || 0), 0),
    }
  }, [advertisers, filteredAdvertisers, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredAdvertisers.length / PUBLIC_PAGE_SIZE))
  const paginatedAdvertisers = useMemo(() => {
    const start = (currentPage - 1) * PUBLIC_PAGE_SIZE
    return filteredAdvertisers.slice(start, start + PUBLIC_PAGE_SIZE)
  }, [currentPage, filteredAdvertisers])

  useEffect(() => {
    let cancelled = false

    async function loadPublicData() {
      try {
        setLoading(true)
        const [adsResponse, advertisersResponse, parishResponse] = await Promise.all([
          fetch('/api/ads-novenario', { cache: 'no-store' }),
          fetch('/api/anunciantes', { cache: 'no-store' }),
          fetch('/api/perfil-paroquia', { cache: 'no-store' }),
        ])
        const [adsPayload, advertisersPayload, parishPayload] = await Promise.all([
          adsResponse.json(),
          advertisersResponse.json(),
          parishResponse.json().catch(() => ({})),
        ])

        if (!adsResponse.ok) throw new Error(adsPayload.error || 'Falha ao carregar anúncios')
        if (!advertisersResponse.ok) throw new Error(advertisersPayload.error || 'Falha ao carregar patrocinadores')

        const nextSponsors = (adsPayload.ads || [])
          .filter((ad) => ad.src)
          .sort((a, b) => {
            if (a.type === 'MASTER' && b.type !== 'MASTER') return -1
            if (a.type !== 'MASTER' && b.type === 'MASTER') return 1
            return 0
          })

        if (!cancelled) {
          setActiveSponsors(nextSponsors)
          setAdvertisers(advertisersPayload.advertisers || [])
          setParishInfo((prev) => ({
            ...prev,
            ...(parishPayload || {}),
          }))
          setLoadError(parishPayload?.error || '')
        }
      } catch (error) {
        if (!cancelled) {
          setActiveSponsors([])
          setAdvertisers([])
          setLoadError(error instanceof Error ? error.message : 'Falha ao carregar dados públicos')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPublicData()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  useEffect(() => {
    if (activeSponsors.length === 0) return

    const timeout = setTimeout(() => {
      setSlideIndex((prev) => (prev + 1) % activeSponsors.length)
    }, Math.max(3, Number(current?.duration) || 10) * 1000)

    return () => clearTimeout(timeout)
  }, [activeSponsors.length, current?.duration])

  useEffect(() => {
    if (slideIndex >= activeSponsors.length && activeSponsors.length > 0) {
      setSlideIndex(0)
    }
  }, [activeSponsors.length, slideIndex])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    const profileNode = parishProfileRef.current
    if (!profileNode) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowParishNav(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      {
        threshold: 0,
        rootMargin: '-72px 0px 0px 0px',
      }
    )

    observer.observe(profileNode)
    return () => observer.disconnect()
  }, [loading])

  if (loading) {
    return <LoadingState fullScreen label="Carregando página pública..." />
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 shadow-sm backdrop-blur transition-all duration-200 ${
          showParishNav ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60">
              <img src={parishInfo.parishLogoUrl || '/brand/icon-logo.svg'} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{parishInfo.parishName || 'PASCOM Stream View'}</span>
              {parishInfo.parishCity ? <span className="block truncate text-xs text-muted-foreground">{parishInfo.parishCity}</span> : null}
            </span>
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </div>

      <PageContainer>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex w-fit items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src="/brand/emblema-16-9.svg" alt="PASCOM Stream View" className="h-12 w-auto object-contain sm:h-14" />
          </Link>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/login">Entrar</Link>
          </Button>
        </header>

        {loadError ? (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{loadError}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setReloadKey((value) => value + 1)} className="border-destructive/40 text-destructive hover:text-destructive">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        ) : null}

        <section ref={parishProfileRef} className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="relative min-h-[300px] bg-muted sm:min-h-[320px]">
            {parishInfo.parishCoverUrl ? (
              <img src={parishInfo.parishCoverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(135deg,_rgba(59,130,246,0.28),_rgba(15,23,42,0.92))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
              <div className="flex min-w-0 items-center gap-3 pr-12 text-left sm:gap-4 sm:pr-32">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/10 text-white shadow-xl sm:h-24 sm:w-24">
                  {parishInfo.parishLogoUrl ? (
                    <img src={parishInfo.parishLogoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <img src="/brand/icon-logo.svg" alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 text-white drop-shadow">
                  <h1 className="max-w-[17rem] truncate text-xl font-bold tracking-tight sm:max-w-[34rem] sm:text-3xl">
                    {parishInfo.parishName || 'PASCOM Stream View'}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/85 sm:text-sm">
                    {parishInfo.parishCity ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {parishInfo.parishCity}
                      </span>
                    ) : null}
                    {parishInfo.parishProfile ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Church className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {parishInfo.parishProfile}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              {parishSocialLinks.length > 0 ? (
                <div className="absolute bottom-4 right-4 flex max-w-[44%] flex-wrap justify-end gap-2 sm:bottom-6 sm:right-6 sm:max-w-xs">
                  {parishSocialLinks.map(({ key, label, Icon, url }) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-9 sm:w-9"
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-between gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Telão e transparência</h2>
            <p className="mt-1 text-sm text-muted-foreground">Preview do telão com busca e histórico público dos patrocinadores logo abaixo.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button asChild>
              <Link href="/telao" target="_blank">
                <Play className="mr-2 h-4 w-4" />
                Abrir telão
              </Link>
            </Button>
            <Button asChild>
              <Link href="/telao-master" target="_blank">
                <Play className="mr-2 h-4 w-4" />
                Abrir telão master
              </Link>
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Patrocínios listados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{publicStats.totalSponsors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tempo por rodada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatDuration(publicStats.totalDuration)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Exibições acumuladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{publicStats.totalViews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tempo exibido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatDuration(publicStats.totalViewedSeconds)}</div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex aspect-video items-center justify-center bg-black">
              {current ? (
                <Media ad={current} className="h-full w-full object-contain" />
              ) : (
                <Megaphone className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            {current && (
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{current.name}</div>
                  <div className="text-sm text-muted-foreground">{formatDuration(current.duration)} por exibição</div>
                </div>
                <Badge className={current.type === 'MASTER' ? 'bg-yellow-500 text-yellow-950' : ''}>
                  {current.type === 'MASTER' ? <Star className="mr-1 h-3 w-3" /> : null}
                  {current.type}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Patrocinadores</h2>
                <p className="text-sm text-muted-foreground">Clique em um patrocinador para abrir o histórico completo e as estatísticas detalhadas.</p>
              </div>
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar patrocinador"
                  className="pl-9"
                />
              </div>
            </div>

            {filteredAdvertisers.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum patrocinador encontrado para essa busca.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {paginatedAdvertisers.map((ad) => (
                    <Link key={ad.id} href={`/anunciantes/${ad.id}`}>
                      <Card className="h-full transition-colors hover:border-primary/50">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
                            <Media ad={ad} className="h-full w-full object-contain" staticFrame />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{ad.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(ad.duration)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {ad.views || 0}
                              </span>
                              <span>{ad.type === 'MASTER' ? '/telao-master' : '/telao'}</span>
                            </div>
                          </div>
                          {isSafePublicUrl(ad.websiteUrl) ? (
                            <a
                              href={ad.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAdvertisers.length}
                  itemLabel="patrocinadores"
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </section>

        <AppFooter className="px-0" />
      </PageContainer>
    </div>
  )
}
