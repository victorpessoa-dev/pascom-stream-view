'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Eye, ExternalLink, Megaphone, Play, Search, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import PaginationControls from '@/components/pagination-controls'
import { useStore } from '@/lib/store'

const PUBLIC_PAGE_SIZE = 9

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`
}

function Media({ ad, className = '' }) {
  if (ad.mediaType === 'video') {
    return <video src={ad.src} className={className} muted playsInline autoPlay loop />
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ad.src} alt={ad.name} className={className} />
}

export default function PublicDashboardPage() {
  const { ads, isLoaded, adminSettings } = useStore()
  const [slideIndex, setSlideIndex] = useState(0)
  const [advertisers, setAdvertisers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const parishName = adminSettings?.appearance?.parishName?.trim()
  const parishLogoUrl = adminSettings?.appearance?.parishLogoUrl?.trim()

  const activeSponsors = useMemo(
    () =>
      ads
        .filter((ad) => ad.active && ad.src)
        .sort((a, b) => {
          if (a.type === 'MASTER' && b.type !== 'MASTER') return -1
          if (a.type !== 'MASTER' && b.type === 'MASTER') return 1
          return 0
        }),
    [ads]
  )

  const current = activeSponsors[slideIndex] || activeSponsors[0]

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

    async function loadAdvertisers() {
      try {
        const response = await fetch('/api/anunciantes', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Falha ao carregar patrocinadores')
        if (!cancelled) setAdvertisers(payload.advertisers || [])
      } catch {
        if (!cancelled) setAdvertisers([])
      }
    }

    loadAdvertisers()
    return () => {
      cancelled = true
    }
  }, [])

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

  if (!isLoaded) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 p-6 sm:p-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            {(parishName || parishLogoUrl) ? (
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {parishLogoUrl ? (
                    <img src={parishLogoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Megaphone className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{parishName || 'PASCOM'}</div>
                </div>
              </div>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight">Dashboard público</h1>
            <p className="mt-1 text-muted-foreground">Preview do telão com busca e transparência dos patrocinadores logo abaixo.</p>
          </div>
          <div className="flex gap-3">
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
            <Button asChild variant="secondary">
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>

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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedAdvertisers.map((ad) => (
                    <Link key={ad.id} href={`/anunciantes/${ad.id}`}>
                      <Card className="h-full transition-colors hover:border-primary/50">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
                            <Media ad={ad} className="h-full w-full object-contain" />
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
                          {ad.websiteUrl?.startsWith('http') ? (
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
      </div>
    </div>
  )
}
