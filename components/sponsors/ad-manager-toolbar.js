'use client'

import { Copy, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

export function AdManagerToolbar({
  searchTerm,
  onSearchChange,
  onCopyPublicUrl,
  onOpenCreateDialog,
  metricsEnabled,
  onMetricsToggle,
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-border/70 pb-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
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

      <div className="grid gap-3 lg:grid-cols-[minmax(240px,320px)_1fr_auto] lg:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar patrocinador, tipo ou site"
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <Switch id="metrics-enabled" checked={metricsEnabled} onCheckedChange={onMetricsToggle} />
            <label htmlFor="metrics-enabled" className="cursor-pointer font-medium text-foreground">
              Contador do telão
            </label>
          </div>
          <span className="text-xs">Conta somente exibições reais do telão público.</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onCopyPublicUrl('/telao')}>
            <Copy className="mr-2 h-4 w-4" />
            /telao
          </Button>
          <Button variant="outline" size="sm" onClick={() => onCopyPublicUrl('/telao-master')}>
            <Copy className="mr-2 h-4 w-4" />
            /telao-master
          </Button>
        </div>
      </div>
    </section>
  )
}

export function AdManagerEmptyState({ orderedAdsLength, filteredAdsLength, onClearSearch }) {
  const noResults = orderedAdsLength > 0 && filteredAdsLength === 0

  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border py-16 text-center">
      <div className="mb-4 h-10 w-10 rounded-full bg-muted/70 p-2 text-muted-foreground">
        <Search className="h-full w-full" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {orderedAdsLength === 0 ? 'Nenhum patrocínio cadastrado' : 'Nenhum resultado encontrado'}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {orderedAdsLength === 0
          ? 'Adicione anúncios para montar a playlist pública do telão.'
          : 'Tente outro termo para localizar o patrocinador no painel do telão.'}
      </p>
      {noResults && onClearSearch ? (
        <Button className="mt-4" variant="outline" onClick={onClearSearch}>
          Limpar busca
        </Button>
      ) : null}
    </div>
  )
}
