'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layers, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DEFAULT_WIDTH = 1920
const DEFAULT_HEIGHT = 1080

export default function CreateOverlayDialog({ open, onOpenChange }) {
  const { createOverlay } = useStore()
  const router = useRouter()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setIsSubmitting(false)
  }

  const handleDialogChange = (nextOpen) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!name.trim()) {
      toast.error('Digite um nome para o overlay')
      return
    }

    setIsSubmitting(true)

    try {
      const newOverlay = await createOverlay({
        name: name.trim(),
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
      })

      toast.success(`Overlay "${name.trim()}" criado com sucesso`)
      handleDialogChange(false)
      router.push(`/editor/${newOverlay.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar overlay')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              Criar novo overlay
            </DialogTitle>
            <DialogDescription>
              O overlay será criado no tamanho padrão para transmissão: 1920x1080.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do overlay</Label>
              <Input
                id="name"
                placeholder="Ex: Overlay principal"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Tamanho padrão</div>
                  <div className="text-sm text-muted-foreground">{DEFAULT_WIDTH}x{DEFAULT_HEIGHT} (Full HD)</div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar overlay'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
