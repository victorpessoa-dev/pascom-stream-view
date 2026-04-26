'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Monitor, Smartphone, Tv, Maximize, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const presets = [
  { id: '1920x1080', label: 'Full HD', width: 1920, height: 1080, icon: Monitor, recommended: true },
  { id: '1280x720', label: 'HD', width: 1280, height: 720, icon: Tv },
  { id: '2560x1440', label: '2K QHD', width: 2560, height: 1440, icon: Monitor },
  { id: '3840x2160', label: '4K UHD', width: 3840, height: 2160, icon: Maximize },
  { id: '1080x1920', label: 'Vertical', width: 1080, height: 1920, icon: Smartphone },
  { id: 'custom', label: 'Personalizado', width: 0, height: 0, icon: Layers },
]

export default function CreateOverlayDialog({ open, onOpenChange }) {
  const { createOverlay } = useStore()
  const router = useRouter()
  const [name, setName] = useState('')
  const [preset, setPreset] = useState('1920x1080')
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)

  const handlePresetChange = (value) => {
    setPreset(value)
    if (value !== 'custom') {
      const selected = presets.find(p => p.id === value)
      if (selected) {
        setWidth(selected.width)
        setHeight(selected.height)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Digite um nome para o overlay')
      return
    }

    if (width < 100 || height < 100) {
      toast.error('A resolucao minima e 100x100')
      return
    }

    const newOverlay = createOverlay({
      name: name.trim(),
      width,
      height,
    })

    toast.success(`Overlay "${name}" criado com sucesso`)
    onOpenChange(false)
    setName('')
    setPreset('1920x1080')
    setWidth(1920)
    setHeight(1080)
    
    router.push(`/editor/${newOverlay.id}`)
  }

  const handleClose = () => {
    onOpenChange(false)
    setName('')
    setPreset('1920x1080')
    setWidth(1920)
    setHeight(1080)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              Criar Novo Overlay
            </DialogTitle>
            <DialogDescription>
              Configure as propriedades do seu novo overlay para transmissao ao vivo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Overlay</Label>
              <Input
                id="name"
                placeholder="Ex: Overlay Principal, Camera 1, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label>Resolucao</Label>
              <RadioGroup value={preset} onValueChange={handlePresetChange} className="grid grid-cols-3 gap-3">
                {presets.map((p) => {
                  const Icon = p.icon
                  return (
                    <div key={p.id}>
                      <RadioGroupItem value={p.id} id={p.id} className="peer sr-only" />
                      <Label
                        htmlFor={p.id}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-muted bg-card cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                      >
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium">{p.label}</p>
                          {p.id !== 'custom' && (
                            <p className="text-xs text-muted-foreground">{p.width}x{p.height}</p>
                          )}
                        </div>
                        {p.recommended && (
                          <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                        )}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {preset === 'custom' && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="space-y-2">
                  <Label htmlFor="width">Largura (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    min={100}
                    max={7680}
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 1920)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={100}
                    max={4320}
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 1080)}
                    className="h-11"
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-3">Preview da proporcao:</p>
              <div className="flex items-center justify-center">
                <div 
                  className="bg-black/80 rounded-lg border border-border flex items-center justify-center text-xs text-white/50"
                  style={{
                    width: Math.min(200, 200 * (width / height)),
                    height: Math.min(120, 120 * (height / width)),
                    aspectRatio: `${width}/${height}`,
                  }}
                >
                  {width}x{height}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Overlay
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
