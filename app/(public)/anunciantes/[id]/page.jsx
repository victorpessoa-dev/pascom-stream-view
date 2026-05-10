'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Clock3,
  Download,
  Eye,
  History,
  MonitorPlay,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PaginationControls from '@/components/pagination-controls'
import { downloadWorkbook } from '@/lib/simple-xlsx'

const REPORT_PAGE_SIZE = 20

function formatarTempo(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0))

  const horas = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const resto = total % 60

  if (horas > 0) return `${horas}h ${minutos}m`
  if (minutos > 0) return `${minutos}m ${resto}s`

  return `${resto}s`
}

function formatarDataHora(data) {
  if (!data) return 'Nunca exibido'

  return new Date(data).toLocaleString('pt-BR')
}

function agruparExibicoesPorDia(logs) {
  const grouped = logs.reduce((acc, log) => {
    const key = new Date(log.displayedAt).toLocaleDateString('pt-BR')

    acc[key] = (acc[key] || 0) + 1

    return acc
  }, {})

  return Object.entries(grouped)
    .map(([date, total]) => ({
      date,
      total,
    }))
    .reverse()
}

function preverProximaExibicao(logs) {
  if (logs.length < 2) return null

  const ordered = [...logs]
    .map((log) => new Date(log.displayedAt).getTime())
    .sort((a, b) => a - b)

  const intervals = []

  for (let index = 1; index < ordered.length; index += 1) {
    intervals.push(ordered[index] - ordered[index - 1])
  }

  if (intervals.length === 0) return null

  const averageInterval =
    intervals.reduce((sum, value) => sum + value, 0) / intervals.length

  return new Date(
    ordered[ordered.length - 1] + averageInterval
  )
}

function MediaPreview({ advertiser }) {
  if (!advertiser?.src) {
    return <div className="h-full w-full bg-muted" />
  }

  if (advertiser.mediaType === 'video') {
    return (
      <video
        src={advertiser.src}
        className="h-full w-full object-contain"
        muted
        playsInline
        controls
      />
    )
  }

  return (
    <img
      src={advertiser.src}
      alt={advertiser.name}
      className="h-full w-full object-contain"
    />
  )
}

export default function AnuncianteDetalhePage() {
  const params = useParams()
  const id = params?.id

  const [data, setData] = useState({
    advertiser: null,
    logs: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    async function carregar() {
      try {
        setLoading(true)

        const response = await fetch(`/api/anunciantes/${id}`, {
          cache: 'no-store',
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(
            payload.error || 'Falha ao carregar anunciante'
          )
        }

        if (!cancelled) {
          setData(payload)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Falha ao carregar anunciante'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (id) {
      carregar()
    }

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    setCurrentPage(1)
  }, [id])


  const advertiser = data?.advertiser ?? null
  const logs = data?.logs ?? []


  const chartData = useMemo(() => {
    return agruparExibicoesPorDia(logs)
  }, [logs])

  const proximaExibicao = useMemo(() => {
    return preverProximaExibicao(logs)
  }, [logs])

  const maxChart = useMemo(() => {
    return Math.max(
      ...chartData.map((item) => item.total),
      1
    )
  }, [chartData])

  const rotaPublica =
    advertiser?.type === 'MASTER'
      ? '/telao-master'
      : '/telao'

  const totalExibicoes = Math.max(
    logs.length,
    advertiser?.views || 0
  )

  const totalDuracao = Math.max(
    logs.reduce(
      (sum, log) => sum + (log.durationSeconds || 0),
      0
    ),
    advertiser?.totalSeconds || 0
  )

  const mediaPorExibicao =
    totalExibicoes > 0
      ? Math.round(totalDuracao / totalExibicoes)
      : 0

  const totalPages = Math.max(
    1,
    Math.ceil(logs.length / REPORT_PAGE_SIZE)
  )

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * REPORT_PAGE_SIZE

    return logs.slice(
      start,
      start + REPORT_PAGE_SIZE
    )
  }, [currentPage, logs])


  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 text-sm text-muted-foreground">
        Carregando anunciante...
      </div>
    )
  }

  if (error || !advertiser) {
    return (
      <div className="min-h-screen bg-background p-8 text-sm text-destructive">
        {error || 'Anunciante não encontrado'}
      </div>
    )
  }

  const baixarRelatorio = () => {
    const downloadedAt = new Date()

    const safeName = advertiser.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()

    const stamp = downloadedAt
      .toLocaleString('sv-SE')
      .replace(' ', '_')
      .replace(/:/g, '-')

    downloadWorkbook({
      filename: `relatorio-${safeName || 'patrocinador'}-${stamp}.xlsx`,

      sheets: [
        {
          name: 'Resumo',

          rows: [
            ['Campo', 'Valor'],
            ['Patrocinador', advertiser.name],
            ['Tipo', advertiser.type],
            ['Rota pública', rotaPublica],
            ['Total de exibições', totalExibicoes],
            ['Tempo total exibido (s)', totalDuracao],
            ['Duração padrão (s)', advertiser.duration],
            ['Média por exibição (s)', mediaPorExibicao],
            [
              'Última exibição ISO',
              advertiser.lastDisplayedAt || '',
            ],
            [
              'Próxima exibição estimada ISO',
              proximaExibicao
                ? proximaExibicao.toISOString()
                : '',
            ],
            [
              'Download do relatório',
              downloadedAt.toISOString(),
            ],
          ],
        },

        {
          name: 'Historico',

          rows: [
            [
              'Data ISO',
              'Data formatada',
              'Duração (s)',
              'Origem',
            ],

            ...logs.map((log) => [
              log.displayedAt || '',
              formatarDataHora(log.displayedAt),
              log.durationSeconds || 0,
              log.source || 'telao',
            ]),
          ],
        },
      ],
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 p-6 sm:p-10">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar para o dashboard público
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">

          <Card>
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-t-xl bg-black">

              <MediaPreview advertiser={advertiser} />

            </div>

            <CardContent className="space-y-4 p-6">

              <div>
                <div className="text-2xl font-bold">
                  {advertiser.name}
                </div>

                <div className="text-sm text-muted-foreground">
                  Tipo: {advertiser.type}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">

                <MonitorPlay className="h-4 w-4" />

                Rota pública:
                <code>{rotaPublica}</code>

              </div>

              <div className="text-sm text-muted-foreground">

                Última exibição:
                {' '}
                {formatarDataHora(
                  advertiser.lastDisplayedAt
                )}

              </div>

              <div className="text-sm text-muted-foreground">

                Próxima exibição estimada:
                {' '}
                {proximaExibicao
                  ? formatarDataHora(
                    proximaExibicao.toISOString()
                  )
                  : 'Sem dados suficientes'}

              </div>

              <div className="text-xs text-muted-foreground">

                A previsão é apenas uma estimativa e pode variar porque a playlist pode ser embaralhada.

              </div>

              <div className="flex flex-wrap gap-2">

                <Button asChild variant="outline">

                  <Link
                    href={rotaPublica}
                    target="_blank"
                  >
                    Abrir {rotaPublica}
                  </Link>

                </Button>

                <Button
                  variant="outline"
                  onClick={baixarRelatorio}
                >

                  <Download className="mr-2 h-4 w-4" />

                  Baixar relatório

                </Button>

              </div>

            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">

            <Card>
              <CardHeader className="pb-2">

                <CardTitle className="text-sm text-muted-foreground">
                  Total de exibições
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold">
                  {totalExibicoes}
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">

                <CardTitle className="text-sm text-muted-foreground">
                  Tempo total exibido
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold">
                  {formatarTempo(totalDuracao)}
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">

                <CardTitle className="text-sm text-muted-foreground">
                  Duração padrão
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold">
                  {formatarTempo(advertiser.duration)}
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">

                <CardTitle className="text-sm text-muted-foreground">
                  Média por exibição
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-3xl font-bold">
                  {formatarTempo(mediaPorExibicao)}
                </div>

              </CardContent>
            </Card>

          </div>
        </div>

        <Card>

          <CardHeader>
            <CardTitle>
              Exibições por dia
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            {chartData.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Ainda não há histórico suficiente para o gráfico.
              </div>
            ) : (
              chartData.map((item) => (
                <div
                  key={item.date}
                  className="space-y-1"
                >

                  <div className="flex items-center justify-between text-sm">

                    <span>{item.date}</span>

                    <span>
                      {item.total} exibição(ões)
                    </span>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-muted">

                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(item.total / maxChart) * 100}%`,
                      }}
                    />

                  </div>
                </div>
              ))
            )}

          </CardContent>
        </Card>

        <Card>

          <CardHeader>
            <CardTitle>
              Histórico completo
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            {logs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhuma exibição registrada.
              </div>
            ) : (
              paginatedLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
                >

                  <div className="flex items-center gap-3 text-sm">

                    <History className="h-4 w-4 text-muted-foreground" />

                    <div>

                      <div>
                        {formatarDataHora(log.displayedAt)}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Origem: {log.source}
                      </div>

                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">

                    <span className="flex items-center gap-1">

                      <Eye className="h-4 w-4" />
                      1

                    </span>

                    <span className="flex items-center gap-1">

                      <Clock3 className="h-4 w-4" />

                      {formatarTempo(
                        log.durationSeconds
                      )}

                    </span>

                  </div>
                </div>
              ))
            )}

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={logs.length}
              itemLabel="registros"
              onPageChange={setCurrentPage}
            />

          </CardContent>
        </Card>
      </div>
    </div>
  )
}