'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, Clock, Eye, Layers, Megaphone, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CreateOverlayDialog from '@/components/create-overlay-dialog'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

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
    <Link href={href}>
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { overlays, ads, isLoaded } = useStore()

  const activeAds = ads.filter((ad) => ad.active).length
  const totalElements = overlays.reduce((acc, overlay) => acc + (overlay.elements?.length || 0), 0)

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Bem-vindo ao PASCOM Stream View</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de Overlays" value={isLoaded ? overlays.length : '-'} description="Overlays criados" icon={Layers} />
        <StatCard title="Propagandas Ativas" value={isLoaded ? activeAds : '-'} description={`De ${ads.length} cadastradas`} icon={Megaphone} />
        <StatCard title="Elementos" value={isLoaded ? totalElements : '-'} description="Total de elementos" icon={Activity} />
        <StatCard title="Status" value="Online" description="Sistema operacional" icon={Eye} />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Acesso rápido</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Gerenciar Overlays"
            description="Crie e edite seus overlays para transmissões"
            href="/overlay"
            icon={Layers}
            color="bg-primary"
          />
          <QuickActionCard
            title="Painel do telão"
            description="Configure patrocínios para /telao e /telao-master"
            href="/painel-telao"
            icon={Megaphone}
            color="bg-chart-2"
          />
          <QuickActionCard
            title="Configurações"
            description="Ajuste as preferências do sistema"
            href="/configuracoes"
            icon={Clock}
            color="bg-chart-4"
          />
        </div>
      </div>

      {isLoaded && overlays.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Overlays recentes</h2>
            <Link href="/overlay" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overlays.slice(0, 3).map((overlay) => (
              <Link key={overlay.id} href={`/editor/${overlay.id}`}>
                <Card className="group cursor-pointer transition-colors hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base transition-colors group-hover:text-primary">{overlay.name}</CardTitle>
                    <CardDescription>
                      {overlay.width} x {overlay.height}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        {overlay.elements?.length || 0} elementos
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(overlay.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <CreateOverlayDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
