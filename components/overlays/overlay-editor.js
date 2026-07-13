'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  Type, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy,
  CopyPlus,
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
  Palette,
  Grid3X3,
  AlignCenterHorizontal,
  AlignCenterVertical
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { uploadMedia } from '@/services/supabase/upload'
import StaticMediaFrame from '@/components/shared/static-media-frame'
import { resolveSnapPosition } from '@/lib/services/overlay-editor'

export default function OverlayEditor({ overlayId }) {
  const { getOverlay, addElement, updateElement, deleteElement, isLoaded } = useStore()
  const router = useRouter()
  const [overlay, setOverlay] = useState(null)
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [zoom, setZoom] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [alignmentGuides, setAlignmentGuides] = useState([])
  const [showGrid, setShowGrid] = useState(true)
  const [addImageDialogOpen, setAddImageDialogOpen] = useState(false)
  const [addTextDialogOpen, setAddTextDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [elementPendingDelete, setElementPendingDelete] = useState(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newText, setNewText] = useState('')
  const [newElementOptions, setNewElementOptions] = useState({
    x: 0,
    y: 0,
    zoom: 100,
    visible: true,
  })
  const [alignTargetId, setAlignTargetId] = useState('canvas')
  const canvasRef = useRef(null)
  const dragPositionRef = useRef(null)

  useEffect(() => {
    if (isLoaded) {
      const found = getOverlay(overlayId)
      if (found) {
        setOverlay(found)
      } else {
        toast.error('Overlay não encontrado')
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

  useEffect(() => {
    if (!selectedElementId || !overlay) return
    if (!overlay.elements.some((element) => element.id === selectedElementId)) {
      setSelectedElementId(null)
    }
  }, [overlay, selectedElementId])

  const selectedElement = overlay?.elements.find(el => el.id === selectedElementId)

  const getDefaultElementOptions = useCallback((defaults = {}) => ({
    x: defaults.x ?? Math.round((overlay?.width || 1920) / 2 - 100),
    y: defaults.y ?? Math.round((overlay?.height || 1080) / 2 - 100),
    zoom: defaults.zoom ?? 100,
    visible: defaults.visible ?? true,
  }), [overlay?.height, overlay?.width])

  const resetNewElementOptions = useCallback((defaults = {}) => {
    setNewElementOptions(getDefaultElementOptions(defaults))
  }, [getDefaultElementOptions])

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) {
      toast.error('Digite uma URL válida')
      return
    }

    try {
      const newEl = await addElement(overlayId, {
        type: 'image',
        src: newImageUrl,
        x: newElementOptions.x,
        y: newElementOptions.y,
        width: Math.round(200 * (newElementOptions.zoom / 100)),
        height: Math.round(200 * (newElementOptions.zoom / 100)),
        visible: newElementOptions.visible,
      })
      if (newEl) setSelectedElementId(newEl.id)
      setNewImageUrl('')
      resetNewElementOptions()
      setAddImageDialogOpen(false)
      toast.success('Imagem adicionada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar imagem')
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const url = await uploadMedia(file, 'overlays')
      setNewImageUrl(url)
      toast.success('Upload enviado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar imagem')
    }
  }

  const handleAddText = async () => {
    if (!newText.trim()) {
      toast.error('Digite um texto')
      return
    }

    try {
      const newEl = await addElement(overlayId, {
        type: 'text',
        text: newText,
        x: newElementOptions.x,
        y: newElementOptions.y,
        width: Math.round(300 * (newElementOptions.zoom / 100)),
        height: Math.round(50 * (newElementOptions.zoom / 100)),
        fontSize: 32,
        fontColor: '#ffffff',
        visible: newElementOptions.visible,
      })
      if (newEl) setSelectedElementId(newEl.id)
      setNewText('')
      resetNewElementOptions({
        x: Math.round((overlay.width || 1920) / 2 - 150),
        y: Math.round((overlay.height || 1080) / 2 - 25),
      })
      setAddTextDialogOpen(false)
      toast.success('Texto adicionado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar texto')
    }
  }

  const handleDeleteElement = useCallback(async (elementId) => {
    try {
      await deleteElement(overlayId, elementId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir elemento')
      return
    }
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
    toast.success('Elemento excluído')
  }, [deleteElement, overlayId, selectedElementId])

  const requestDeleteElement = useCallback((elementId) => {
    setElementPendingDelete(elementId)
    setDeleteDialogOpen(true)
  }, [])

  const handleDuplicateElement = async () => {
    if (!selectedElement) return
    try {
      const newEl = await addElement(overlayId, {
        ...selectedElement,
        x: selectedElement.x + 24,
        y: selectedElement.y + 24,
        zIndex: selectedElement.zIndex + 1,
      })
      if (newEl) setSelectedElementId(newEl.id)
      toast.success('Elemento duplicado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao duplicar elemento')
    }
  }

  const handleElementUpdate = (field, value) => {
    if (selectedElementId) {
      updateElement(overlayId, selectedElementId, { [field]: value })
    }
  }

  const handleElementBatchUpdate = (updates) => {
    if (selectedElementId) {
      updateElement(overlayId, selectedElementId, updates)
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
      toast.success('Posição resetada')
    }
  }

  const handleAlign = (axis) => {
    if (!selectedElement) return

    const target = alignTargetId === 'canvas'
      ? { x: 0, y: 0, width: overlay.width, height: overlay.height }
      : overlay.elements.find((element) => element.id === alignTargetId)

    if (!target) return

    const updates = axis === 'horizontal'
      ? { x: Math.round(target.x + target.width / 2 - selectedElement.width / 2) }
      : { y: Math.round(target.y + target.height / 2 - selectedElement.height / 2) }

    updateElement(overlayId, selectedElement.id, updates)
  }

  const copyOverlayUrl = () => {
    const url = `${window.location.origin}/shared/${overlay.publicId || overlayId}`
    navigator.clipboard.writeText(url)
    toast.success('URL copiada para a área de transferência')
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectedElementId || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

      const step = event.shiftKey ? 10 : 1
      const selected = overlay?.elements.find((element) => element.id === selectedElementId)
      if (!selected) return

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        requestDeleteElement(selectedElementId)
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        updateElement(overlayId, selectedElementId, { x: selected.x - step })
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        updateElement(overlayId, selectedElementId, { x: selected.x + step })
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        updateElement(overlayId, selectedElementId, { y: selected.y - step })
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        updateElement(overlayId, selectedElementId, { y: selected.y + step })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [overlay?.elements, overlayId, requestDeleteElement, selectedElementId, updateElement])

  const handleMouseDown = useCallback((e, elementId) => {
    e.stopPropagation()
    setSelectedElementId(elementId)
    setAlignmentGuides([])
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
      const rawX = Math.round((e.clientX - canvasRect.left - dragOffset.x * zoom) / zoom)
      const rawY = Math.round((e.clientY - canvasRect.top - dragOffset.y * zoom) / zoom)
      const movingElement = overlay?.elements.find((element) => element.id === selectedElementId)
      const result = movingElement && overlay
        ? resolveSnapPosition({
          overlay,
          movingElement,
          elements: overlay.elements,
          nextX: rawX,
          nextY: rawY,
          zoom,
        })
        : { x: rawX, y: rawY, guides: [] }

      dragPositionRef.current = { x: result.x, y: result.y }
      setAlignmentGuides(result.guides)
      setOverlay((current) => {
        if (!current) return current
        return {
          ...current,
          elements: current.elements.map((element) =>
            element.id === selectedElementId ? { ...element, x: result.x, y: result.y } : element
          ),
        }
      })
    }
  }, [dragOffset, isDragging, overlay, selectedElementId, zoom])

  const handleMouseUp = useCallback(() => {
    if (selectedElementId && dragPositionRef.current) {
      updateElement(overlayId, selectedElementId, dragPositionRef.current)
      dragPositionRef.current = null
    }
    setAlignmentGuides([])
    setIsDragging(false)
  }, [overlayId, selectedElementId, updateElement])

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
          <Link href="/overlay">
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
          <Dialog
            open={addImageDialogOpen}
            onOpenChange={(open) => {
              setAddImageDialogOpen(open)
              if (open) {
                resetNewElementOptions({
                  x: Math.round((overlay.width || 1920) / 2 - 100),
                  y: Math.round((overlay.height || 1080) / 2 - 100),
                })
              }
            }}
          >
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
                    <Label>URL da imagem</Label>
                  <Input
                    placeholder="https://exemplo.com/imagem.png"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload da imagem</Label>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Posição X</Label>
                    <Input
                      type="number"
                      value={newElementOptions.x}
                      onChange={(e) => setNewElementOptions((prev) => ({ ...prev, x: parseInt(e.target.value, 10) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Posição Y</Label>
                    <Input
                      type="number"
                      value={newElementOptions.y}
                      onChange={(e) => setNewElementOptions((prev) => ({ ...prev, y: parseInt(e.target.value, 10) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Zoom inicial ({newElementOptions.zoom}%)</Label>
                  <Slider
                    value={[newElementOptions.zoom]}
                    onValueChange={([value]) => setNewElementOptions((prev) => ({ ...prev, zoom: value }))}
                    min={10}
                    max={300}
                    step={5}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <Label>Visível ao criar</Label>
                  <Switch
                    checked={newElementOptions.visible}
                    onCheckedChange={(checked) => setNewElementOptions((prev) => ({ ...prev, visible: checked }))}
                  />
                </div>
                {newImageUrl && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                    <StaticMediaFrame
                      src={newImageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.opacity = 0.3
                      }}
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

          <Dialog
            open={addTextDialogOpen}
            onOpenChange={(open) => {
              setAddTextDialogOpen(open)
              if (open) {
                resetNewElementOptions({
                  x: Math.round((overlay.width || 1920) / 2 - 150),
                  y: Math.round((overlay.height || 1080) / 2 - 25),
                })
              }
            }}
          >
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Posição X</Label>
                    <Input
                      type="number"
                      value={newElementOptions.x}
                      onChange={(e) => setNewElementOptions((prev) => ({ ...prev, x: parseInt(e.target.value, 10) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Posição Y</Label>
                    <Input
                      type="number"
                      value={newElementOptions.y}
                      onChange={(e) => setNewElementOptions((prev) => ({ ...prev, y: parseInt(e.target.value, 10) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Zoom inicial ({newElementOptions.zoom}%)</Label>
                  <Slider
                    value={[newElementOptions.zoom]}
                    onValueChange={([value]) => setNewElementOptions((prev) => ({ ...prev, zoom: value }))}
                    min={10}
                    max={300}
                    step={5}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <Label>Visível ao criar</Label>
                  <Switch
                    checked={newElementOptions.visible}
                    onCheckedChange={(checked) => setNewElementOptions((prev) => ({ ...prev, visible: checked }))}
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
            <Link href={`/shared/${overlay.publicId || overlayId}`} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visualizar
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-muted/20 p-3 sm:p-4 lg:p-6">
          {/* Zoom Controls */}
          <div className="mb-4 inline-flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-2">
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
            onClick={() => {
              setSelectedElementId(null)
              setAlignmentGuides([])
            }}
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

            {alignmentGuides.map((guide, index) => (
              <div
                key={`${guide.orientation}-${guide.position}-${index}`}
                className="absolute pointer-events-none z-[999] bg-cyan-400/90 shadow-[0_0_0_1px_rgba(34,211,238,0.28)]"
                style={guide.orientation === 'vertical'
                  ? {
                    left: guide.position * zoom,
                    top: guide.start * zoom,
                    width: 1,
                    height: Math.max(1, (guide.end - guide.start) * zoom),
                  }
                  : {
                    left: guide.start * zoom,
                    top: guide.position * zoom,
                    width: Math.max(1, (guide.end - guide.start) * zoom),
                    height: 1,
                  }}
              />
            ))}
            
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
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedElementId(element.id)
                }}
              >
                {element.type === 'image' && element.src && (
                  <StaticMediaFrame
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
        <aside className="flex w-full flex-col border-t border-border bg-card xl:w-80 xl:border-l xl:border-t-0">
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
                              requestDeleteElement(element.id)
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
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={handleDuplicateElement}>
                      <CopyPlus className="w-4 h-4 mr-2" />
                      Duplicar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => requestDeleteElement(selectedElement.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>

                  <Separator />

                  {/* Transform */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Move className="w-3 h-3" /> Posição e tamanho
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

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ZoomIn className="w-3 h-3" /> Zoom do elemento
                    </Label>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Ajusta largura e altura juntas com base no tamanho padrão do tipo de elemento.
                      </div>
                      <Slider
                        value={[Math.max(10, Math.round((selectedElement.width / (selectedElement.type === 'text' ? 300 : 200)) * 100))]}
                        onValueChange={([value]) => {
                          const baseWidth = selectedElement.type === 'text' ? 300 : 200
                          const baseHeight = selectedElement.type === 'text' ? 50 : 200
                          handleElementBatchUpdate({
                            width: Math.round(baseWidth * (value / 100)),
                            height: Math.round(baseHeight * (value / 100)),
                          })
                        }}
                        min={10}
                        max={300}
                        step={5}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Alinhamento
                    </Label>
                    <Select value={alignTargetId} onValueChange={setAlignTargetId}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="canvas">Tela inteira</SelectItem>
                        {overlay.elements
                          .filter((element) => element.id !== selectedElement.id)
                          .map((element) => (
                            <SelectItem key={element.id} value={element.id}>
                              {element.type === 'text' ? element.text || 'Texto' : 'Imagem'} ({element.x}, {element.y})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAlign('horizontal')}>
                        <AlignCenterHorizontal className="w-4 h-4 mr-2" />
                        Horizontal
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAlign('vertical')}>
                        <AlignCenterVertical className="w-4 h-4 mr-2" />
                        Vertical
                      </Button>
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
                    <Label className="text-sm">Visível</Label>
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
                          <StaticMediaFrame
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir elemento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esse elemento será removido do overlay imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setElementPendingDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (elementPendingDelete) {
                  handleDeleteElement(elementPendingDelete)
                }
                setElementPendingDelete(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
