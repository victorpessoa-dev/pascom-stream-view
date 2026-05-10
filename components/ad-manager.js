'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Copy, Edit2, ExternalLink, Image as ImageIcon, Megaphone, Plus, Search, Trash2, Video, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { uploadMedia } from '@/services/supabase/upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
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
import PaginationControls from '@/components/pagination-controls'

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

function MediaPreview({ ad, compact = false }) {
  const sizeClass = compact ? 'h-14 w-20' : 'h-32 w-full'

  if (!ad.src) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-muted ${sizeClass}`}>
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    )
  }

  if (ad.mediaType === 'video') {
    return <video src={ad.src} className={`${sizeClass} rounded-lg bg-black object-contain`} muted playsInline />
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ad.src} alt={ad.name || 'Patrocínio'} className={`${sizeClass} rounded-lg bg-black object-contain`} />
}

function TypeBadge({ ad }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge className={ad.type === 'MASTER' ? 'bg-yellow-500 text-yellow-950' : ''}>
        {ad.type === 'MASTER' ? <Zap className="mr-1 h-3 w-3" /> : null}
        {ad.type}
      </Badge>
      <Badge variant="secondary">
        {ad.mediaType === 'video' ? <Video className="mr-1 h-3 w-3" /> : <ImageIcon className="mr-1 h-3 w-3" />}
        {ad.mediaType === 'video' ? 'Vídeo' : 'Imagem'}
      </Badge>
    </div>
  )
}

export default function AdManager({ defaultDurations = { NORMAL: 10, MASTER: 15 } }) {
  const { ads, createAd, updateAd, deleteAd, isLoaded, sponsorSettings, updateSponsorSettings } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAd, setEditingAd] = useState(null)
  const [newAd, setNewAd] = useState(() => createEmptyAd(defaultDurations))
  const [searchTerm, setSearchTerm] = useState('')
  const [adPendingDelete, setAdPendingDelete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

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

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const getTypeDuration = (type) => (type === 'MASTER' ? defaultDurations.MASTER : defaultDurations.NORMAL)

  const readUpload = async (file, setter) => {
    if (!file) return

    try {
      const url = await uploadMedia(file, 'sponsors')
      setter((prev) => ({ ...prev, src: url, sourceType: 'upload' }))
      toast.success('Upload enviado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar arquivo')
    }
  }

  const normalizeAd = (ad) => ({
    ...ad,
    mediaType: ad.type === 'NORMAL' ? 'image' : ad.mediaType,
    duration: Math.max(3, Number(ad.duration) || 10),
  })

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

    try {
      await createAd(ad)
      toast.success(`Patrocínio "${ad.name}" criado`)
      setDialogOpen(false)
      setNewAd(createEmptyAd(defaultDurations))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar patrocínio')
    }
  }

  const handleEditAd = async () => {
    if (!editingAd) return

    try {
      await updateAd(editingAd.id, normalizeAd(editingAd))
      toast.success('Patrocínio atualizado')
      setEditDialogOpen(false)
      setEditingAd(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar patrocínio')
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

  const copyPublicUrl = (path) => {
    navigator.clipboard.writeText(`${window.location.origin}${path}`)
    toast.success(`URL ${path} copiada`)
  }

  const form = (ad, setAd) => (
    <div className="space-y-5 py-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={ad.name} onChange={(e) => setAd((prev) => ({ ...prev, name: e.target.value }))} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={ad.type}
            onValueChange={(value) =>
              setAd((prev) => ({
                ...prev,
                type: value,
                duration: getTypeDuration(value),
                mediaType: value === 'NORMAL' ? 'image' : prev.mediaType,
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MASTER">MASTER</SelectItem>
              <SelectItem value="NORMAL">NORMAL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Mídia</Label>
          <Select value={ad.mediaType} disabled={ad.type === 'NORMAL'} onValueChange={(value) => setAd((prev) => ({ ...prev, mediaType: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Imagem</SelectItem>
              <SelectItem value="video">Vídeo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Link da mídia</Label>
        <Input
          placeholder={ad.mediaType === 'video' ? 'https://exemplo.com/video.mp4' : 'https://exemplo.com/imagem.png'}
          value={ad.sourceType === 'upload' ? '' : ad.src}
          onChange={(e) => setAd((prev) => ({ ...prev, src: e.target.value, sourceType: 'link' }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Site do anunciante</Label>
        <Input
          placeholder="https://anunciante.com.br"
          value={ad.websiteUrl || ''}
          onChange={(e) => setAd((prev) => ({ ...prev, websiteUrl: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Upload</Label>
        <Input type="file" accept={ad.mediaType === 'video' ? 'video/*' : 'image/*'} onChange={(event) => readUpload(event.target.files?.[0], setAd)} />
      </div>

      <div className="space-y-2">
        <Label>Duração da exibição: {ad.duration}s</Label>
        <Slider value={[ad.duration]} onValueChange={([value]) => setAd((prev) => ({ ...prev, duration: value }))} min={3} max={120} step={1} />
      </div>

      {ad.src ? <MediaPreview ad={ad} /> : null}
    </div>
  )

  if (!isLoaded) {
    return <div className="py-12 text-sm text-muted-foreground">Carregando patrocínios...</div>
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Playlist pública</div>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Patrocínios cadastrados</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ative, edite e acompanhe os patrocinadores a partir de uma lista operacional mais enxuta.
            </p>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (open) setNewAd(createEmptyAd(defaultDurations))
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo patrocínio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo patrocínio</DialogTitle>
                <DialogDescription>
                  O tipo normal aparece em <code>/telao</code>. O tipo master aparece em <code>/telao-master</code>.
                </DialogDescription>
              </DialogHeader>
              {form(newAd, setNewAd)}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateAd}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(240px,320px)_1fr_auto] lg:items-center">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar patrocinador, tipo ou site"
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={sponsorSettings.metricsEnabled}
                onCheckedChange={async (checked) => {
                  try {
                    await updateSponsorSettings({ metricsEnabled: checked })
                    toast.success(checked ? 'Contador do telão ativado' : 'Contador do telão desativado')
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuração')
                  }
                }}
              />
              <span>Contador do telão</span>
            </div>
            <span className="text-xs">Conta somente exibições reais do telão público.</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copyPublicUrl('/telao')}>
              <Copy className="mr-2 h-4 w-4" />
              /telao
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyPublicUrl('/telao-master')}>
              <Copy className="mr-2 h-4 w-4" />
              /telao-master
            </Button>
          </div>
        </div>
      </section>

      {filteredAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border py-16 text-center">
          <Megaphone className="mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            {orderedAds.length === 0 ? 'Nenhum patrocínio cadastrado' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {orderedAds.length === 0
              ? 'Adicione anúncios para montar a playlist pública do telão.'
              : 'Tente outro termo para localizar o patrocinador no painel do telão.'}
          </p>
        </div>
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
                        <Button variant="outline" size="icon" className="text-destructive" onClick={() => setAdPendingDelete(ad)}>
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
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => setAdPendingDelete(ad)}>
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
          {editingAd ? form(editingAd, setEditingAd) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditAd}>Salvar</Button>
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
