'use client'

import { Copy, Megaphone, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import EmptyState from '@/components/shared/empty-state'

export function AdManagerToolbar({
  searchTerm,
  onSearchChange,
  onCopyPublicUrl,
  onOpenCreateDialog,
  metricsEnabled,
  metricsPaused,
  activeCounts,
  onMetricsToggle,
  onMetricsPauseToggle,
}) {
  const normalPaused = Boolean(metricsPaused?.NORMAL)
  const masterPaused = Boolean(metricsPaused?.MASTER)
  const normalActiveCount = activeCounts?.NORMAL || 0
  const masterActiveCount = activeCounts?.MASTER || 0
  const hasAnyActiveSponsor = normalActiveCount > 0 || masterActiveCount > 0

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Playlist pública</div>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Patrocínios cadastrados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ative, edite e acompanhe os patrocinadores a partir de uma lista operacional mais enxuta.
          </p>
        </div>

        <Button onClick={onOpenCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo patrocínio
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-border/70 bg-card/25 p-3 xl:grid-cols-[minmax(260px,360px)_minmax(360px,1fr)_auto] xl:items-stretch">
        <div className="flex min-w-0 flex-col justify-center gap-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Busca</div>
          <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar patrocinador, tipo ou site"
            className="pl-9"
          />
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-background/35 p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label htmlFor="metrics-enabled" className="cursor-pointer text-sm font-medium text-foreground">
                Contador do telão
              </label>
              <div className="mt-1 text-xs text-muted-foreground">
                Conta apenas tipos com patrocinadores ativos.
              </div>
            </div>
            <Switch
              id="metrics-enabled"
              checked={metricsEnabled}
              disabled={!hasAnyActiveSponsor}
              onCheckedChange={onMetricsToggle}
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-xs">
              <span>
                <span className="block font-medium text-foreground">NORMAL</span>
                <span className="text-muted-foreground">{normalActiveCount} ativo(s)</span>
              </span>
              <Switch
                id="metrics-normal"
                checked={metricsEnabled && !normalPaused}
                disabled={normalActiveCount === 0}
                onCheckedChange={(checked) => onMetricsPauseToggle('NORMAL', !checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-xs">
              <span>
                <span className="block font-medium text-foreground">MASTER</span>
                <span className="text-muted-foreground">{masterActiveCount} ativo(s)</span>
              </span>
              <Switch
                id="metrics-master"
                checked={metricsEnabled && !masterPaused}
                disabled={masterActiveCount === 0}
                onCheckedChange={(checked) => onMetricsPauseToggle('MASTER', !checked)}
              />
            </label>
          </div>
          {!hasAnyActiveSponsor ? (
            <div className="mt-2 text-xs text-destructive">Ative um patrocinador NORMAL ou MASTER para ligar o contador.</div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-2 xl:min-w-[250px]">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Atalhos</div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Button variant="outline" size="sm" onClick={() => onCopyPublicUrl('/telao')} className="justify-start">
              <Copy className="mr-2 h-4 w-4" />
              /telao
            </Button>
            <Button variant="outline" size="sm" onClick={() => onCopyPublicUrl('/telao-master')} className="justify-start">
              <Copy className="mr-2 h-4 w-4" />
              /telao-master
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AdManagerEmptyState({ orderedAdsLength, filteredAdsLength, onClearSearch }) {
  const noResults = orderedAdsLength > 0 && filteredAdsLength === 0

  return (
    <EmptyState
      icon={orderedAdsLength === 0 ? Megaphone : Search}
      title={orderedAdsLength === 0 ? 'Nenhum patrocínio cadastrado' : 'Nenhum resultado encontrado'}
      description={
        orderedAdsLength === 0
          ? 'Adicione anúncios para montar a playlist pública do telão.'
          : 'Tente outro termo para localizar o patrocinador no painel do telão.'
      }
      action={noResults && onClearSearch ? (
        <Button className="mt-4" variant="outline" onClick={onClearSearch}>
          Limpar busca
        </Button>
      ) : null}
    />
  )
}
