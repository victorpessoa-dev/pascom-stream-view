'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Plus, Trash2, ExternalLink, Play, Megaphone, Image as ImageIcon, Clock, Zap, Monitor, Copy, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AdManager() {
  const { ads, createAd, updateAd, deleteAd, isLoaded } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAd, setEditingAd] = useState(null)
  const [newAd, setNewAd] = useState({
    name: '',
    type: 'NORMAL',
    src: '',
    duration: 10,
  })

  const handleCreateAd = () => {
    if (!newAd.name.trim()) {
      toast.error('Digite um nome para a propaganda')
      return
    }
    if (!newAd.src.trim()) {
      toast.error('Digite a URL da imagem')
      return
    }

    createAd(newAd)
    toast.success(`Propaganda "${newAd.name}" criada com sucesso`)
    setDialogOpen(false)
    setNewAd({ name: '', type: 'NORMAL', src: '', duration: 10 })
  }

  const handleEditAd = () => {
    if (!editingAd) return
    updateAd(editingAd.id, {
      name: editingAd.name,
      type: editingAd.type,
      src: editingAd.src,
      duration: editingAd.duration,
    })
    toast.success(`Propaganda atualizada`)
    setEditDialogOpen(false)
    setEditingAd(null)
  }

  const handleDelete = (id, name) => {
    deleteAd(id)
    toast.success(`Propaganda "${name}" excluida`)
  }

  const handleToggleActive = (id, currentActive) => {
    updateAd(id, { active: !currentActive })
    toast.success(currentActive ? 'Propaganda desativada' : 'Propaganda ativada')
  }

  const copyTelaoUrl = () => {
    const url = `${window.location.origin}/telao`
    navigator.clipboard.writeText(url)
    toast.success('URL do telao copiada')
  }

  const activeAds = ads.filter(a => a.active)
  const totalDuration = activeAds.reduce((acc, ad) => acc + ad.duration, 0)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando propagandas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">Propagandas Cadastradas</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyTelaoUrl} size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copiar URL
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Propaganda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Propaganda</DialogTitle>
                <DialogDescription>
                  Adicione uma nova imagem ou propaganda ao sistema de telao rotativo.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ad-name">Nome da Propaganda</Label>
                  <Input
                    id="ad-name"
                    placeholder="Ex: Promocao Black Friday"
                    value={newAd.name}
                    onChange={(e) => setNewAd(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-src">URL da Imagem</Label>
                  <Input
                    id="ad-src"
                    placeholder="https://exemplo.com/imagem.png"
                    value={newAd.src}
                    onChange={(e) => setNewAd(prev => ({ ...prev, src: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select 
                      value={newAd.type} 
                      onValueChange={(value) => setNewAd(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASTER">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            MASTER
                          </div>
                        </SelectItem>
                        <SelectItem value="NORMAL">
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            NORMAL
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duracao: {newAd.duration}s</Label>
                    <Slider
                      value={[newAd.duration]}
                      onValueChange={([v]) => setNewAd(prev => ({ ...prev, duration: v }))}
                      min={3}
                      max={60}
                      step={1}
                      className="mt-3"
                    />
                  </div>
                </div>

                {newAd.src && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-border">
                      <img 
                        src={newAd.src} 
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.opacity = '0.3'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAd}>
                  Criar Propaganda
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Ads Grid */}
      {ads.length === 0 ? (
        <Card className="border-dashed border-2 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma propaganda cadastrada</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Adicione propagandas para exibir no sistema de telao rotativo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <Card 
              key={ad.id} 
              className={`group overflow-hidden transition-all duration-300 hover:shadow-lg ${
                ad.active 
                  ? 'bg-card/50 backdrop-blur-sm hover:border-primary/50' 
                  : 'bg-muted/30 opacity-60'
              }`}
            >
              {/* Image Preview */}
              <div className="aspect-video bg-black relative overflow-hidden">
                {ad.src ? (
                  <img 
                    src={ad.src} 
                    alt={ad.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge 
                    variant={ad.type === 'MASTER' ? 'default' : 'secondary'}
                    className={ad.type === 'MASTER' ? 'bg-yellow-500 text-yellow-950' : ''}
                  >
                    {ad.type === 'MASTER' && <Zap className="w-3 h-3 mr-1" />}
                    {ad.type}
                  </Badge>
                </div>
                
                {/* Duration */}
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-black/60 text-white border-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {ad.duration}s
                  </Badge>
                </div>

                {/* Active indicator */}
                {ad.active && (
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-green-500 text-white border-0">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-1.5" />
                      Ativo
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{ad.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {ad.type === 'MASTER' ? 'Exibicao prioritaria' : 'Exibicao normal'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ad.active}
                      onCheckedChange={() => handleToggleActive(ad.id, ad.active)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setEditingAd(ad)
                      setEditDialogOpen(true)
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(ad.id, ad.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Propaganda</DialogTitle>
            <DialogDescription>
              Altere as informacoes da propaganda.
            </DialogDescription>
          </DialogHeader>
          
          {editingAd && (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label>Nome da Propaganda</Label>
                <Input
                  value={editingAd.name}
                  onChange={(e) => setEditingAd(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>URL da Imagem</Label>
                <Input
                  value={editingAd.src}
                  onChange={(e) => setEditingAd(prev => ({ ...prev, src: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select 
                    value={editingAd.type} 
                    onValueChange={(value) => setEditingAd(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASTER">MASTER</SelectItem>
                      <SelectItem value="NORMAL">NORMAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duracao: {editingAd.duration}s</Label>
                  <Slider
                    value={[editingAd.duration]}
                    onValueChange={([v]) => setEditingAd(prev => ({ ...prev, duration: v }))}
                    min={3}
                    max={60}
                    step={1}
                    className="mt-3"
                  />
                </div>
              </div>

              {editingAd.src && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-border">
                  <img 
                    src={editingAd.src} 
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAd}>
              Salvar Alteracoes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
}
