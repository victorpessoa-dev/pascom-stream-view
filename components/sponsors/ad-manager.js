'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Edit2, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store/store'
import { uploadMedia } from '@/services/supabase/upload'
import { Button } from '@/components/ui/button'
import LoadingState from '@/components/shared/loading-state'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import PaginationControls from '@/components/shared/pagination-controls'
import { MediaPreview, SponsorForm, TypeBadge } from '@/components/sponsors/ad-manager-parts'
import { AdManagerEmptyState, AdManagerToolbar } from '@/components/sponsors/ad-manager-toolbar'

const ADMIN_PAGE_SIZE = 10

function createEmptyAd(defaultDurations) {
  return {
    name: '',
    type: 'NORMAL',
    src: '',
    duration: defaultDurations.NORMAL,
    mediaType: 'image',
    sourceType: 'link',
    websiteUrl: '',
  }
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`
}

function formatDateTime(value) {
  if (!value) return 'Nunca exibido'
  return new Date(value).toLocaleString('pt-BR')
}

export default function AdManager({ defaultDurations = { NORMAL: 10, MASTER: 15 } }) {
  const { ads, createAd, updateAd, deleteAd, error, isLoaded, sponsorSettings, updateSponsorSettings } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAd, setEditingAd] = useState(null)
  const [newAd, setNewAd] = useState(() => createEmptyAd(defaultDurations))
  const [searchTerm, setSearchTerm] = useState('')
  const [adPendingDelete, setAdPendingDelete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [savingAd, setSavingAd] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  const orderedAds = useMemo(
    () =>
      [...ads].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1
        if (a.type === 'MASTER' && b.type !== 'MASTER') return -1
        if (a.type !== 'MASTER' && b.type === 'MASTER') return 1
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }),
    [ads]
  )

  const filteredAds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return orderedAds

    return orderedAds.filter((ad) =>
      [ad.name, ad.type, ad.websiteUrl]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [orderedAds, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredAds.length / ADMIN_PAGE_SIZE))
  const paginatedAds = useMemo(() => {
    const start = (currentPage - 1) * ADMIN_PAGE_SIZE
    return filteredAds.slice(start, start + ADMIN_PAGE_SIZE)
  }, [currentPage, filteredAds])
  const activeSponsorCounts = useMemo(() => ({
    NORMAL: ads.filter((ad) => ad.active && ad.type === 'NORMAL').length,
    MASTER: ads.filter((ad) => ad.active && ad.type === 'MASTER').length,
  }), [ads])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    if (!isLoaded || !sponsorSettings.metricsEnabled) return

    const nextPaused = {
      NORMAL: activeSponsorCounts.NORMAL === 0 || Boolean(sponsorSettings.metricsPaused?.NORMAL),
      MASTER: activeSponsorCounts.MASTER === 0 || Boolean(sponsorSettings.metricsPaused?.MASTER),
    }
    const nextEnabled = activeSponsorCounts.NORMAL > 0 || activeSponsorCounts.MASTER > 0
      ? !(nextPaused.NORMAL && nextPaused.MASTER)
      : false

    if (
      nextEnabled !== sponsorSettings.metricsEnabled ||
      nextPaused.NORMAL !== Boolean(sponsorSettings.metricsPaused?.NORMAL) ||
      nextPaused.MASTER !== Boolean(sponsorSettings.metricsPaused?.MASTER)
    ) {
      updateSponsorSettings({
        metricsEnabled: nextEnabled,
        metricsPaused: nextPaused,
      }).catch((requestError) => {
        toast.error(requestError instanceof Error ? requestError.message : 'Erro ao atualizar contador')
      })
    }
  }, [activeSponsorCounts.MASTER, activeSponsorCounts.NORMAL, isLoaded, sponsorSettings.metricsEnabled, sponsorSettings.metricsPaused, updateSponsorSettings])

  const getTypeDuration = useCallback(
    (type) => (type === 'MASTER' ? defaultDurations.MASTER : defaultDurations.NORMAL),
    [defaultDurations.MASTER, defaultDurations.NORMAL]
  )

  const readUpload = useCallback(async (file, setter) => {
    if (!file) return

    try {
      const url = await uploadMedia(file, 'sponsors')
      const uploadedMediaType = file.type?.startsWith('video/') ? 'video' : 'image'
      setter((prev) => ({
        ...prev,
        src: url,
        sourceType: 'upload',
        mediaType: uploadedMediaType,
      }))
      toast.success(uploadedMediaType === 'video' ? 'Vídeo enviado' : 'Imagem enviada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar arquivo')
    }
  }, [])

  const normalizeAd = useCallback((ad) => ({
    ...ad,
    mediaType: ad.mediaType === 'video' ? 'video' : 'image',
    duration: Math.max(3, Number(ad.duration) || 10),
  }), [])

  const updateMetricsEnabled = useCallback(async (checked) => {
    if (checked && activeSponsorCounts.NORMAL === 0 && activeSponsorCounts.MASTER === 0) {
      throw new Error('Ative pelo menos um patrocinador NORMAL ou MASTER antes de ligar o contador')
    }

    await updateSponsorSettings({
      metricsEnabled: checked,
      metricsPaused: checked
        ? {
          NORMAL: activeSponsorCounts.NORMAL === 0,
          MASTER: activeSponsorCounts.MASTER === 0,
        }
        : sponsorSettings.metricsPaused,
    })
  }, [activeSponsorCounts.MASTER, activeSponsorCounts.NORMAL, sponsorSettings.metricsPaused, updateSponsorSettings])

  const updateMetricsPause = useCallback(async (kind, paused) => {
    if (!paused && activeSponsorCounts[kind] === 0) {
      throw new Error(`Nao ha patrocinador ${kind} ativo para contar`)
    }

    const nextPaused = {
      NORMAL: activeSponsorCounts.NORMAL === 0 || Boolean(sponsorSettings.metricsPaused?.NORMAL),
      MASTER: activeSponsorCounts.MASTER === 0 || Boolean(sponsorSettings.metricsPaused?.MASTER),
      [kind]: paused,
    }

    await updateSponsorSettings({
      metricsEnabled: (activeSponsorCounts.NORMAL > 0 || activeSponsorCounts.MASTER > 0) && !(nextPaused.NORMAL && nextPaused.MASTER),
      metricsPaused: nextPaused,
    })
  }, [activeSponsorCounts, sponsorSettings.metricsPaused, updateSponsorSettings])

  const handleCreateAd = async () => {
    const ad = normalizeAd(newAd)

    if (!ad.name.trim()) {
      toast.error('Digite um nome para o patrocínio')
      return
    }
    if (!ad.src.trim()) {
      toast.error('Adicione uma imagem, vídeo ou link')
      return
    }

    if (uploadingMedia) {
      toast.error('Aguarde o upload terminar antes de salvar')
      return
    }

    setSavingAd(true)
    try {
      await createAd(ad)
      toast.success(`Patrocínio "${ad.name}" criado`)
      setDialogOpen(false)
      setNewAd(createEmptyAd(defaultDurations))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar patrocínio')
    } finally {
      setSavingAd(false)
    }
  }

  const handleEditAd = async () => {
    if (!editingAd) return

    if (uploadingMedia) {
      toast.error('Aguarde o upload terminar antes de salvar')
      return
    }

    setSavingAd(true)
    try {
      await updateAd(editingAd.id, normalizeAd(editingAd))
      toast.success('Patrocínio atualizado')
      setEditDialogOpen(false)
      setEditingAd(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar patrocínio')
    } finally {
      setSavingAd(false)
    }
  }

  const handleDeleteAd = async () => {
    if (!adPendingDelete) return

    try {
      await deleteAd(adPendingDelete.id)
      toast.success(`Patrocínio "${adPendingDelete.name}" excluído`)
      setAdPendingDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir patrocínio')
    }
  }

  const copyPublicUrl = useCallback((path) => {
    navigator.clipboard.writeText(`${window.location.origin}${path}`)
    toast.success(`URL ${path} copiada`)
  }, [])

  if (!isLoaded) {
    return <LoadingState label="Carregando patrocínios..." />
  }

  return (
    <div className="space-y-5">
      <AdManagerToolbar
        searchTerm={searchTerm}
        onSearchChange={(event) => setSearchTerm(event.target.value)}
        onCopyPublicUrl={copyPublicUrl}
        metricsEnabled={sponsorSettings.metricsEnabled}
        metricsPaused={sponsorSettings.metricsPaused}
        activeCounts={activeSponsorCounts}
        onMetricsToggle={async (checked) => {
          try {
            await updateMetricsEnabled(checked)
            toast.success(checked ? 'Contador do telão ativado' : 'Contador do telão desativado')
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuração')
          }
        }}
        onMetricsPauseToggle={async (kind, paused) => {
          try {
            await updateMetricsPause(kind, paused)
            toast.success(paused ? `Contador ${kind} pausado` : `Contador ${kind} retomado`)
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuração')
          }
        }}
        onOpenCreateDialog={() => {
          setNewAd(createEmptyAd(defaultDurations))
          setDialogOpen(true)
        }}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (open) setNewAd(createEmptyAd(defaultDurations))
        }}
      >
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo patrocínio</DialogTitle>
            <DialogDescription>
              O tipo normal aparece em <code>/telao</code>. O tipo master aparece em <code>/telao-master</code>.
            </DialogDescription>
          </DialogHeader>
          <SponsorForm ad={newAd} setAd={setNewAd} getTypeDuration={getTypeDuration} onUpload={readUpload} onUploadStateChange={setUploadingMedia} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={savingAd || uploadingMedia}>Cancelar</Button>
            <Button onClick={handleCreateAd} disabled={savingAd || uploadingMedia}>
              {savingAd ? 'Salvando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredAds.length === 0 ? (
        <AdManagerEmptyState
          orderedAdsLength={orderedAds.length}
          filteredAdsLength={filteredAds.length}
          onClearSearch={() => setSearchTerm('')}
        />
      ) : (
        <>
          <div className="hidden rounded-xl border border-border/80 lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Prévia</TableHead>
                  <TableHead>Patrocinador</TableHead>
                  <TableHead className="w-[120px]">Rota</TableHead>
                  <TableHead className="w-[130px]">Última exibição</TableHead>
                  <TableHead className="w-[110px]">Tempo no ar</TableHead>
                  <TableHead className="w-[92px] text-center">Ativo</TableHead>
                  <TableHead className="w-[220px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAds.map((ad) => (
                  <TableRow key={ad.id} className={!ad.active ? 'opacity-65' : ''}>
                    <TableCell>
                      <MediaPreview ad={ad} compact />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{ad.name}</div>
                        <TypeBadge ad={ad} />
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(ad.duration)} por rodada · {ad.views || 0} exibições
                        </div>
                        {ad.websiteUrl ? <div className="truncate text-xs text-muted-foreground">{ad.websiteUrl}</div> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ad.type === 'MASTER' ? '/telao-master' : '/telao'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(ad.lastDisplayedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDuration(ad.totalSeconds)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Switch
                          checked={ad.active}
                          onCheckedChange={async () => {
                            try {
                              await updateAd(ad.id, { active: !ad.active })
                              toast.success(!ad.active ? 'Patrocinador ativado no telão' : 'Patrocinador removido do telão')
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : 'Erro ao atualizar patrocinador')
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAd(ad)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/anunciantes/${ad.id}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Relatório
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setAdPendingDelete(ad)}
                          aria-label={`Excluir patrocínio ${ad.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 lg:hidden">
            {paginatedAds.map((ad) => (
              <div key={ad.id} className={`border border-border/80 p-3 ${!ad.active ? 'opacity-65' : ''}`}>
                <div className="flex gap-3">
                  <MediaPreview ad={ad} compact />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{ad.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDuration(ad.duration)} por rodada · {ad.views || 0} exibições
                        </div>
                      </div>
                      <Switch
                        checked={ad.active}
                        onCheckedChange={async () => {
                          try {
                            await updateAd(ad.id, { active: !ad.active })
                            toast.success(!ad.active ? 'Patrocinador ativado no telão' : 'Patrocinador removido do telão')
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : 'Erro ao atualizar patrocinador')
                          }
                        }}
                      />
                    </div>
                    <TypeBadge ad={ad} />
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Rota: {ad.type === 'MASTER' ? '/telao-master' : '/telao'}</div>
                      <div>Última exibição: {formatDateTime(ad.lastDisplayedAt)}</div>
                      <div>Tempo no ar: {formatDuration(ad.totalSeconds)}</div>
                      {ad.websiteUrl ? <div className="truncate">{ad.websiteUrl}</div> : null}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAd(ad)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/anunciantes/${ad.id}`} target="_blank">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Relatório
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setAdPendingDelete(ad)}
                        aria-label={`Excluir patrocínio ${ad.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAds.length}
            itemLabel="patrocínios"
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar patrocínio</DialogTitle>
            <DialogDescription>Atualize mídia, link, tipo e tempo de exibição.</DialogDescription>
          </DialogHeader>
          {editingAd ? <SponsorForm ad={editingAd} setAd={setEditingAd} getTypeDuration={getTypeDuration} onUpload={readUpload} onUploadStateChange={setUploadingMedia} /> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingAd || uploadingMedia}>Cancelar</Button>
            <Button onClick={handleEditAd} disabled={savingAd || uploadingMedia}>
              {savingAd ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(adPendingDelete)} onOpenChange={(open) => !open && setAdPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir patrocínio?</AlertDialogTitle>
            <AlertDialogDescription>
              {adPendingDelete
                ? `O patrocínio "${adPendingDelete.name}" será removido do painel e do telão.`
                : 'Confirme a exclusão do patrocínio.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAd} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
