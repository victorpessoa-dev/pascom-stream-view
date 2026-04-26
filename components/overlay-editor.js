'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  Type, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy,
  Layers,
  Move,
  Settings,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Save,
  Palette,
  Grid3X3
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OverlayEditor({ overlayId }) {
  const { getOverlay, updateOverlay, addElement, updateElement, deleteElement, isLoaded } = useStore()
  const router = useRouter()
  const [overlay, setOverlay] = useState(null)
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [zoom, setZoom] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [addImageDialogOpen, setAddImageDialogOpen] = useState(false)
  const [addTextDialogOpen, setAddTextDialogOpen] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newText, setNewText] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    if (isLoaded) {
      const found = getOverlay(overlayId)
      if (found) {
        setOverlay(found)
      } else {
        toast.error('Overlay nao encontrado')
        router.push('/')
      }
    }
  }, [isLoaded, overlayId, getOverlay, router])

  useEffect(() => {
    const handleUpdate = () => {
      const found = getOverlay(overlayId)
      if (found) {
        setOverlay(found)
      }
    }
    window.addEventListener('streamoverlay_update', handleUpdate)
    return () => window.removeEventListener('streamoverlay_update', handleUpdate)
  }, [overlayId, getOverlay])

  const selectedElement = overlay?.elements.find(el => el.id === selectedElementId)

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast.error('Digite uma URL valida')
      return
    }
    const newEl = addElement(overlayId, {
      type: 'image',
      src: newImageUrl,
      x: Math.round(overlay.width / 2 - 100),
      y: Math.round(overlay.height / 2 - 100),
      width: 200,
      height: 200,
    })
    setSelectedElementId(newEl.id)
    setNewImageUrl('')
    setAddImageDialogOpen(false)
    toast.success('Imagem adicionada')
  }

  const handleAddText = () => {
    if (!newText.trim()) {
      toast.error('Digite um texto')
      return
    }
    const newEl = addElement(overlayId, {
      type: 'text',
      text: newText,
      x: Math.round(overlay.width / 2 - 150),
      y: Math.round(overlay.height / 2 - 25),
      width: 300,
      height: 50,
      fontSize: 32,
      fontColor: '#ffffff',
    })
    setSelectedElementId(newEl.id)
    setNewText('')
    setAddTextDialogOpen(false)
    toast.success('Texto adicionado')
  }

  const handleDeleteElement = (elementId) => {
    deleteElement(overlayId, elementId)
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
    toast.success('Elemento excluido')
  }

  const handleElementUpdate = (field, value) => {
    if (selectedElementId) {
      updateElement(overlayId, selectedElementId, { [field]: value })
    }
  }

  const handleMoveLayer = (elementId, direction) => {
    const element = overlay.elements.find(e => e.id === elementId)
    if (!element) return
    const newZIndex = direction === 'up' ? element.zIndex + 1 : Math.max(1, element.zIndex - 1)
    updateElement(overlayId, elementId, { zIndex: newZIndex })
  }

  const handleResetPosition = () => {
    if (selectedElementId) {
      updateElement(overlayId, selectedElementId, { 
        x: Math.round(overlay.width / 2 - selectedElement.width / 2),
        y: Math.round(overlay.height / 2 - selectedElement.height / 2)
      })
      toast.success('Posicao resetada')
    }
  }

  const copyOverlayUrl = () => {
    const url = `${window.location.origin}/overlay/${overlayId}`
    navigator.clipboard.writeText(url)
    toast.success('URL copiada para a area de transferencia')
  }

  const handleMouseDown = useCallback((e, elementId) => {
    e.stopPropagation()
    setSelectedElementId(elementId)
    const element = overlay?.elements.find(el => el.id === elementId)
    if (element) {
      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }, [overlay])

  const handleMouseMove = useCallback((e) => {
    if (isDragging && selectedElementId && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect()
      const newX = Math.round((e.clientX - canvasRect.left - dragOffset.x * zoom) / zoom)
      const newY = Math.round((e.clientY - canvasRect.top - dragOffset.y * zoom) / zoom)
      updateElement(overlayId, selectedElementId, { x: newX, y: newY })
    }
  }, [isDragging, selectedElementId, dragOffset, zoom, overlayId, updateElement])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!isLoaded || !overlay) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 sticky top-0 z-50">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/overlays">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">{overlay.name}</h1>
          <p className="text-xs text-muted-foreground">{overlay.width}x{overlay.height} - {overlay.elements.length} elemento(s)</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add Element Dialogs */}
          <Dialog open={addImageDialogOpen} onOpenChange={setAddImageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <ImageIcon className="w-4 h-4 mr-2" />
                Imagem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Imagem</DialogTitle>
                <DialogDescription>
                  Cole a URL de uma imagem para adicionar ao overlay
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    placeholder="https://exemplo.com/imagem.png"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                  />
                </div>
                {newImageUrl && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                    <img 
                      src={newImageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => e.target.style.opacity = 0.3}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddImageDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddImage}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addTextDialogOpen} onOpenChange={setAddTextDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Type className="w-4 h-4 mr-2" />
                Texto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Texto</DialogTitle>
                <DialogDescription>
                  Digite o texto que deseja adicionar ao overlay
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Texto</Label>
                  <Textarea
                    placeholder="Digite seu texto aqui..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="min-h-24"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddTextDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddText}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Separator orientation="vertical" className="h-8" />
          
          <Button variant="outline" size="sm" onClick={copyOverlayUrl}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar URL
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/overlay/${overlayId}`} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visualizar
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 bg-muted/20 overflow-auto p-6">
          {/* Zoom Controls */}
          <div className="mb-4 flex items-center gap-3 bg-card p-2 rounded-lg border border-border inline-flex">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg"
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Slider
              value={[zoom * 100]}
              onValueChange={([v]) => setZoom(v / 100)}
              min={10}
              max={100}
              step={5}
              className="w-32"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg"
              onClick={() => setZoom(Math.min(1, zoom + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Separator orientation="vertical" className="h-6" />
            <Button 
              variant={showGrid ? 'secondary' : 'ghost'}
              size="icon" 
              className="h-8 w-8 rounded-lg"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg"
              onClick={() => setZoom(Math.min(1, (window.innerWidth - 400) / overlay.width * 0.8))}
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="relative bg-black rounded-xl overflow-hidden mx-auto shadow-2xl shadow-black/50 border border-border"
            style={{ 
              width: overlay.width * zoom, 
              height: overlay.height * zoom,
            }}
            onClick={() => setSelectedElementId(null)}
          >
            {/* Grid pattern */}
            {showGrid && (
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
                }}
              />
            )}
            
            {/* Elements */}
            {overlay.elements.map((element) => (
              <div
                key={element.id}
                className={`absolute cursor-move transition-shadow ${
                  selectedElementId === element.id 
                    ? 'ring-2 ring-primary shadow-lg shadow-primary/30' 
                    : 'hover:ring-2 hover:ring-primary/50'
                } ${!element.visible ? 'opacity-30' : ''}`}
                style={{
                  left: element.x * zoom,
                  top: element.y * zoom,
                  width: element.width * zoom,
                  height: element.height * zoom,
                  zIndex: element.zIndex,
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              >
                {element.type === 'image' && element.src && (
                  <img 
                    src={element.src} 
                    alt=""
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                )}
                {element.type === 'text' && (
                  <div 
                    className="w-full h-full flex items-center justify-center pointer-events-none text-center"
                    style={{ 
                      fontSize: element.fontSize * zoom,
                      color: element.fontColor,
                      fontFamily: element.fontFamily,
                    }}
                  >
                    {element.text}
                  </div>
                )}
                
                {/* Selection handles */}
                {selectedElementId === element.id && (
                  <>
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-primary-foreground" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-primary-foreground" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-primary-foreground" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-primary-foreground" />
                  </>
                )}
              </div>
            ))}
            
            {/* Empty state */}
            {overlay.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Adicione elementos usando a barra de ferramentas</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 border-l border-border bg-card flex flex-col">
          <Tabs defaultValue="elements" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 bg-muted">
              <TabsTrigger value="elements" className="flex-1">
                <Layers className="w-4 h-4 mr-2" />
                Elementos
              </TabsTrigger>
              <TabsTrigger value="properties" className="flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Propriedades
              </TabsTrigger>
            </TabsList>

            {/* Elements Tab */}
            <TabsContent value="elements" className="flex-1 p-4 overflow-hidden">
              <ScrollArea className="h-full">
                {overlay.elements.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum elemento adicionado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...overlay.elements]
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((element) => (
                      <div
                        key={element.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedElementId === element.id 
                            ? 'bg-primary/10 border-primary/50 text-foreground' 
                            : 'bg-muted/50 border-transparent hover:bg-muted hover:border-border'
                        }`}
                        onClick={() => setSelectedElementId(element.id)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          element.type === 'image' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {element.type === 'image' ? (
                            <ImageIcon className="w-5 h-5" />
                          ) : (
                            <Type className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {element.type === 'text' ? element.text : 'Imagem'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {element.x}, {element.y} - z:{element.zIndex}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveLayer(element.id, 'up')
                            }}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveLayer(element.id, 'down')
                            }}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleElementUpdate('visible', !element.visible)
                            }}
                          >
                            {element.visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteElement(element.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties" className="flex-1 p-4 overflow-auto">
              {selectedElement ? (
                <div className="space-y-6">
                  {/* Transform */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Move className="w-3 h-3" /> Posicao e Tamanho
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={handleResetPosition}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Centralizar
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={selectedElement.x}
                          onChange={(e) => handleElementUpdate('x', parseInt(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={selectedElement.y}
                          onChange={(e) => handleElementUpdate('y', parseInt(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Largura</Label>
                        <Input
                          type="number"
                          value={selectedElement.width}
                          onChange={(e) => handleElementUpdate('width', parseInt(e.target.value) || 100)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Altura</Label>
                        <Input
                          type="number"
                          value={selectedElement.height}
                          onChange={(e) => handleElementUpdate('height', parseInt(e.target.value) || 100)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Layer */}
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3 h-3" /> Camada
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={selectedElement.zIndex}
                        onChange={(e) => handleElementUpdate('zIndex', parseInt(e.target.value) || 1)}
                        className="h-9 flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9"
                          onClick={() => handleMoveLayer(selectedElement.id, 'down')}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9"
                          onClick={() => handleMoveLayer(selectedElement.id, 'up')}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm">Visivel</Label>
                    <Switch
                      checked={selectedElement.visible}
                      onCheckedChange={(checked) => handleElementUpdate('visible', checked)}
                    />
                  </div>

                  <Separator />

                  {/* Type-specific properties */}
                  {selectedElement.type === 'image' && (
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Imagem
                      </Label>
                      <Input
                        value={selectedElement.src}
                        onChange={(e) => handleElementUpdate('src', e.target.value)}
                        placeholder="https://..."
                        className="h-9"
                      />
                      {selectedElement.src && (
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                          <img 
                            src={selectedElement.src} 
                            alt="Preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedElement.type === 'text' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Type className="w-3 h-3" /> Texto
                        </Label>
                        <Textarea
                          value={selectedElement.text}
                          onChange={(e) => handleElementUpdate('text', e.target.value)}
                          className="min-h-20"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Palette className="w-3 h-3" /> Estilo
                        </Label>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Tamanho da Fonte</Label>
                            <div className="flex items-center gap-3">
                              <Slider
                                value={[selectedElement.fontSize]}
                                onValueChange={([v]) => handleElementUpdate('fontSize', v)}
                                min={8}
                                max={200}
                                step={1}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={selectedElement.fontSize}
                                onChange={(e) => handleElementUpdate('fontSize', parseInt(e.target.value) || 24)}
                                className="h-9 w-20"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Cor do Texto</Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={selectedElement.fontColor}
                                onChange={(e) => handleElementUpdate('fontColor', e.target.value)}
                                className="w-12 h-9 rounded-lg border border-border cursor-pointer bg-transparent"
                              />
                              <Input
                                value={selectedElement.fontColor}
                                onChange={(e) => handleElementUpdate('fontColor', e.target.value)}
                                className="h-9 flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Fonte</Label>
                            <Select 
                              value={selectedElement.fontFamily}
                              onValueChange={(value) => handleElementUpdate('fontFamily', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sans-serif">Sans Serif</SelectItem>
                                <SelectItem value="serif">Serif</SelectItem>
                                <SelectItem value="monospace">Monospace</SelectItem>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Verdana">Verdana</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                                <SelectItem value="Impact">Impact</SelectItem>
                                <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                                <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Settings className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Selecione um elemento para editar suas propriedades
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  )
}
