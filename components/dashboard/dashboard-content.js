'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, Clock, Eye, Layers, Megaphone, TrendingUp } from 'lucide-react'
import { DonutChart, HorizontalBarChart } from '@/components/shared/simple-charts'
import PageContainer from '@/components/layout/page-container'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/lib/store/store'
import { cn } from '@/lib/utils/cn'

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${rest}s`
  return `${rest}s`
}

function StatCard({ title, value, description, icon: Icon, trend, className }) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        {trend ? (
          <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
            <TrendingUp className="h-3 w-3" />
            <span>{trend}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function QuickActionCard({ title, description, href, icon: Icon, color }) {
  return (
    <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <Card className="group h-full cursor-pointer transition-colors hover:border-primary/50">
        <CardContent className="pt-6">
          <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl', color)}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mb-1 font-semibold transition-colors group-hover:text-primary">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-4 flex items-center gap-1 text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
            <span>Acessar</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardContent() {
  const { overlays, ads, isLoaded } = useStore()

  const activeAds = useMemo(() => ads.filter((ad) => ad.active).length, [ads])
  const inactiveAds = useMemo(() => ads.filter((ad) => !ad.active).length, [ads])
  const totalViews = useMemo(() => ads.reduce((sum, ad) => sum + (ad.views || 0), 0), [ads])
  const totalSeconds = useMemo(() => ads.reduce((sum, ad) => sum + (ad.totalSeconds || 0), 0), [ads])
  const totalElements = useMemo(() => overlays.reduce((acc, overlay) => acc + (overlay.elements?.length || 0), 0), [overlays])
  const sponsorStatusData = useMemo(
    () =>
      [
        { label: 'Ativos', value: activeAds },
        { label: 'Inativos', value: inactiveAds, className: 'bg-muted-foreground' },
      ].filter((item) => item.value > 0),
    [activeAds, inactiveAds]
  )
  const sponsorTypeData = useMemo(() => {
    const normal = ads.filter((ad) => ad.type === 'NORMAL').length
    const master = ads.filter((ad) => ad.type === 'MASTER').length
    return [
      { label: 'Normal', value: normal },
      { label: 'Master', value: master, className: 'bg-chart-4' },
    ].filter((item) => item.value > 0)
  }, [ads])
  const topViewsData = useMemo(
    () =>
      [...ads]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .filter((ad) => (ad.views || 0) > 0)
        .map((ad) => ({ label: ad.name, value: ad.views || 0 })),
    [ads]
  )
  const topTimeData = useMemo(
    () =>
      [...ads]
        .sort((a, b) => (b.totalSeconds || 0) - (a.totalSeconds || 0))
        .slice(0, 5)
        .filter((ad) => (ad.totalSeconds || 0) > 0)
        .map((ad) => ({ label: ad.name, value: ad.totalSeconds || 0, className: 'bg-chart-2' })),
    [ads]
  )

  return (
    <PageContainer>
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Bem-vindo ao PASCOM Stream View.</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de overlays" value={isLoaded ? overlays.length : '-'} description="Overlays criados" icon={Layers} />
        <StatCard title="Patrocínios ativos" value={isLoaded ? activeAds : '-'} description={`De ${ads.length} cadastrados`} icon={Megaphone} />
        <StatCard title="Elementos" value={isLoaded ? totalElements : '-'} description="Total de elementos" icon={Activity} />
        <StatCard title="Exibições" value={isLoaded ? totalViews : '-'} description={`Tempo total: ${formatDuration(totalSeconds)}`} icon={Eye} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visão dos patrocínios</CardTitle>
            <CardDescription>Status e tipos cadastrados no painel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium">Status</h3>
              <DonutChart data={isLoaded ? sponsorStatusData : []} emptyMessage="Nenhum patrocínio cadastrado." />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Tipo</h3>
              <DonutChart data={isLoaded ? sponsorTypeData : []} emptyMessage="Nenhum patrocínio cadastrado." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho dos patrocínios</CardTitle>
            <CardDescription>Ranking por exibições e tempo acumulado.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium">Mais exibidos</h3>
              <HorizontalBarChart data={isLoaded ? topViewsData : []} emptyMessage="Ainda não há exibições registradas." />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Maior tempo no ar</h3>
              <HorizontalBarChart data={isLoaded ? topTimeData : []} valueFormatter={formatDuration} emptyMessage="Ainda não há tempo registrado." />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Acesso rápido</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard title="Gerenciar overlays" description="Crie e edite seus overlays para transmissões." href="/overlay" icon={Layers} color="bg-primary" />
          <QuickActionCard title="Painel do telão" description="Configure patrocínios para /telao e /telao-master." href="/painel-telao" icon={Megaphone} color="bg-chart-2" />
          <QuickActionCard title="Configurações" description="Ajuste as preferências do sistema." href="/configuracoes" icon={Clock} color="bg-chart-4" />
        </div>
      </div>

    </PageContainer>
  )
}
