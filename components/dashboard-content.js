'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Layers, 
  Megaphone, 
  Plus, 
  ArrowRight,
  Activity,
  Clock,
  Eye,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CreateOverlayDialog from '@/components/create-overlay-dialog'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function StatCard({ title, value, description, icon: Icon, trend, className }) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActionCard({ title, description, href, icon: Icon, color }) {
  return (
    <Link href={href}>
      <Card className="group hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
            color
          )}>
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-1 mt-4 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Acessar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardContent() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { overlays, ads, isLoaded } = useStore()

  const activeAds = ads.filter(a => a.active).length
  const totalElements = overlays.reduce((acc, o) => acc + (o.elements?.length || 0), 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao Pascom Stream View
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Overlay
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total de Overlays"
          value={isLoaded ? overlays.length : '-'}
          description="Overlays criados"
          icon={Layers}
        />
        <StatCard
          title="Propagandas Ativas"
          value={isLoaded ? activeAds : '-'}
          description={`De ${ads.length} cadastradas`}
          icon={Megaphone}
        />
        <StatCard
          title="Elementos"
          value={isLoaded ? totalElements : '-'}
          description="Total de elementos"
          icon={Activity}
        />
        <StatCard
          title="Status"
          value="Online"
          description="Sistema operacional"
          icon={Eye}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Acesso Rapido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Gerenciar Overlays"
            description="Crie e edite seus overlays para transmissoes"
            href="/overlays"
            icon={Layers}
            color="bg-primary"
          />
          <QuickActionCard
            title="Telao de Propagandas"
            description="Configure propagandas para exibir no telao"
            href="/telao"
            icon={Megaphone}
            color="bg-chart-2"
          />
          <QuickActionCard
            title="Configuracoes"
            description="Ajuste as preferencias do sistema"
            href="/configuracoes"
            icon={Clock}
            color="bg-chart-4"
          />
        </div>
      </div>

      {/* Recent Overlays */}
      {isLoaded && overlays.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overlays Recentes</h2>
            <Link href="/overlays" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overlays.slice(0, 3).map((overlay) => (
              <Link key={overlay.id} href={`/editor/${overlay.id}`}>
                <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {overlay.name}
                    </CardTitle>
                    <CardDescription>
                      {overlay.width} x {overlay.height}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {overlay.elements?.length || 0} elementos
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
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
