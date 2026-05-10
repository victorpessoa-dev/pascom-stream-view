'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Play, TimerReset } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/app-shell'
import AdManager from '@/components/ad-manager'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { createSupabaseBrowserClient } from '@/services/supabase/browser'

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${rest}s`
  return `${rest}s`
}

function formatDateTime(value) {
  if (!value) return 'Nunca'
  return new Date(value).toLocaleString('pt-BR')
}

function MetricItem({ label, value, accent = false }) {
  return (
    <div className="min-w-0 border-l border-border/70 pl-4 first:border-l-0 first:pl-0">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold sm:text-2xl ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</div>
    </div>
  )
}

export default function PainelTelaoPage() {
  const { ads, isLoaded } = useStore()
  const [defaultDurations, setDefaultDurations] = useState({ NORMAL: 10, MASTER: 15 })

  const activeAds = useMemo(() => ads.filter((ad) => ad.active), [ads])
  const totalViews = useMemo(() => ads.reduce((sum, ad) => sum + (ad.views || 0), 0), [ads])
  const totalSeconds = useMemo(() => ads.reduce((sum, ad) => sum + (ad.totalSeconds || 0), 0), [ads])
  const nextRoundSeconds = useMemo(
    () => activeAds.reduce((sum, ad) => sum + Math.max(3, Number(ad.duration) || 0), 0),
    [activeAds]
  )
  const latestDisplay = useMemo(
    () =>
      ads
        .map((ad) => ad.lastDisplayedAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null,
    [ads]
  )

  useEffect(() => {
    let mounted = true

    async function loadAdminSettings() {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'admin_settings').maybeSingle()
        if (error) throw error

        const telao = data?.value?.telao || {}
        if (mounted) {
          setDefaultDurations({
            NORMAL: Number(telao.defaultDurationNormal) || Number(telao.defaultDuration) || 10,
            MASTER: Number(telao.defaultDurationMaster) || Number(telao.defaultDuration) || 15,
          })
        }
      } catch {
        if (mounted) {
          setDefaultDurations({ NORMAL: 10, MASTER: 15 })
        }
      }
    }

    loadAdminSettings()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <AppShell>
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <section className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Operação do Telão</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Painel de patrocínios</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Controle o que entra na playlist pública, acompanhe a rodada atual e ajuste a operação dos dois telões a partir de uma visão única.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/telao-master" target="_blank">
                  <Play className="mr-2 h-4 w-4" />
                  Abrir /telao-master
                  <ExternalLink className="ml-2 h-4 w-4 opacity-60" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/telao" target="_blank">
                  <Play className="mr-2 h-4 w-4" />
                  Abrir /telao
                  <ExternalLink className="ml-2 h-4 w-4 opacity-60" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {isLoaded ? (
          <section className="grid gap-4 border-b border-border/70 py-5 sm:grid-cols-2 xl:grid-cols-6">
            <MetricItem label="Anúncios" value={ads.length} />
            <MetricItem label="Ativos" value={activeAds.length} accent />
            <MetricItem label="Exibições" value={totalViews} />
            <MetricItem label="Tempo exibido" value={formatDuration(totalSeconds)} />
            <MetricItem label="Rodada atual" value={formatDuration(nextRoundSeconds)} />
            <div className="min-w-0 border-l border-border/70 pl-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <TimerReset className="h-3.5 w-3.5" />
                Última leitura
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{formatDateTime(latestDisplay)}</div>
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-3 border-b border-border/70 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Status operacional</div>
            <div className="mt-1 text-sm text-muted-foreground">
              O modo normal usa a arte padrão do tipo NORMAL. O modo master usa o layout configurado para MASTER.
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Duração padrão: <span className="font-medium text-foreground">NORMAL {defaultDurations.NORMAL}s</span> ·{' '}
            <span className="font-medium text-foreground">MASTER {defaultDurations.MASTER}s</span>
          </div>
        </section>

        <section className="pt-5">
          <AdManager defaultDurations={defaultDurations} />
        </section>
      </div>
    </AppShell>
  )
}
