'use client'

import { useStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, MoreVertical, ExternalLink, Copy, Layers, Clock, Image as ImageIcon, Type } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function OverlayList({ searchQuery = '' }) {
  const { overlays, deleteOverlay, isLoaded } = useStore()
  
  const filteredOverlays = overlays.filter(overlay => 
    overlay.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (id, name) => {
    deleteOverlay(id)
    toast.success(`Overlay "${name}" excluido com sucesso`)
  }

  const copyOverlayUrl = (id) => {
    const url = `${window.location.origin}/overlay/${id}`
    navigator.clipboard.writeText(url)
    toast.success('URL copiada para a area de transferencia')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const countElementsByType = (elements) => {
    const images = elements.filter(e => e.type === 'image').length
    const texts = elements.filter(e => e.type === 'text').length
    return { images, texts }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando overlays...</p>
        </div>
      </div>
    )
  }

  if (filteredOverlays.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum overlay criado</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Crie seu primeiro overlay clicando no botao &quot;Novo Overlay&quot; acima para comecar a personalizar suas transmissoes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredOverlays.map((overlay) => {
        const { images, texts } = countElementsByType(overlay.elements)
        
        return (
          <Card 
            key={overlay.id} 
            className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {overlay.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-normal">
                      {overlay.width}x{overlay.height}
                    </Badge>
                    {images > 0 && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        {images}
                      </Badge>
                    )}
                    {texts > 0 && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        <Type className="w-3 h-3 mr-1" />
                        {texts}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/editor/${overlay.id}`} className="flex items-center">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar overlay
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyOverlayUrl(overlay.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar URL
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/overlay/${overlay.id}`} target="_blank" className="flex items-center">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir em nova aba
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(overlay.id, overlay.name)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir overlay
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview */}
              <div className="aspect-video bg-black/80 rounded-lg overflow-hidden relative border border-border group-hover:border-primary/30 transition-colors">
                {overlay.elements.length > 0 ? (
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      transform: `scale(${Math.min(1, 280 / overlay.width)})`, 
                      transformOrigin: 'top left',
                      width: overlay.width,
                      height: overlay.height,
                    }}
                  >
                    {overlay.elements.filter(el => el.visible).map((element) => (
                      <div
                        key={element.id}
                        className="absolute"
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          zIndex: element.zIndex,
                        }}
                      >
                        {element.type === 'image' && element.src && (
                          <img 
                            src={element.src} 
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        )}
                        {element.type === 'text' && (
                          <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{ 
                              fontSize: element.fontSize,
                              color: element.fontColor,
                              fontFamily: element.fontFamily,
                            }}
                          >
                            {element.text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Sem elementos</p>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                  <span className="text-white text-xs">Clique para editar</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDate(overlay.updatedAt)}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="default" size="sm" className="rounded-lg">
                    <Link href={`/editor/${overlay.id}`}>
                      <Edit className="w-4 h-4 mr-1.5" />
                      Editar
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-lg">
                    <Link href={`/overlay/${overlay.id}`} target="_blank">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
