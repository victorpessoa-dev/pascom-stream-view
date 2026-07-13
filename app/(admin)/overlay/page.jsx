'use client'

import { useMemo, useState } from 'react'
import { Layers, Plus, Search } from 'lucide-react'
import AppShell from '@/components/layout/app-shell'
import PageContainer from '@/components/layout/page-container'
import OverlayList from '@/components/overlays/overlay-list'
import CreateOverlayDialog from '@/components/overlays/create-overlay-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/lib/store/store'

function MetricItem({ label, value }) {
  return (
    <div className="min-w-0 border-l border-border/70 pl-4 first:border-l-0 first:pl-0">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{value}</div>
    </div>
  )
}

export default function OverlaysPage() {
  const { overlays, isLoaded } = useStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const visibleOverlays = useMemo(
    () => overlays.filter((overlay) => overlay.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [overlays, searchQuery]
  )

  const totalElements = useMemo(
    () => visibleOverlays.reduce((sum, overlay) => sum + overlay.elements.length, 0),
    [visibleOverlays]
  )

  const totalImages = useMemo(
    () => visibleOverlays.reduce((sum, overlay) => sum + overlay.elements.filter((element) => element.type === 'image').length, 0),
    [visibleOverlays]
  )

  const totalTexts = useMemo(
    () => visibleOverlays.reduce((sum, overlay) => sum + overlay.elements.filter((element) => element.type === 'text').length, 0),
    [visibleOverlays]
  )

  return (
    <AppShell>
      <PageContainer>
        <section className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Biblioteca de Overlay</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Gestão de sobreposições</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Organize seus overlays como uma biblioteca operacional: encontre rápido, veja o conteúdo principal e entre direto no editor ou na visualização pública.
              </p>
            </div>

            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo overlay
            </Button>
          </div>
        </section>

        {isLoaded ? (
          <section className="grid gap-4 border-b border-border/70 py-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricItem label="Overlays" value={visibleOverlays.length} />
            <MetricItem label="Elementos" value={totalElements} />
            <MetricItem label="Imagens" value={totalImages} />
            <MetricItem label="Textos" value={totalTexts} />
          </section>
        ) : null}

        <section className="flex flex-col gap-4 border-b border-border/70 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Layers className="h-4 w-4" />
              Biblioteca pronta para edição e visualização
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Use a busca para filtrar a lista e abra o overlay direto no editor ou na rota pública.
            </div>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar overlays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </section>

        <section className="pt-5">
          <OverlayList searchQuery={searchQuery} />
        </section>

        <CreateOverlayDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </PageContainer>
    </AppShell>
  )
}
