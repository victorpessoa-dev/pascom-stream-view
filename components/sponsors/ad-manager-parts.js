'use client'

import { Image as ImageIcon, Video, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import StaticMediaFrame from '@/components/shared/static-media-frame'

export function MediaPreview({ ad, compact = false }) {
  const sizeClass = compact ? 'h-14 w-20' : 'h-32 w-full'

  if (!ad.src) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-muted ${sizeClass}`}>
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    )
  }

  if (ad.mediaType === 'video') {
    return <StaticMediaFrame src={ad.src} type="video" className={`${sizeClass} rounded-lg bg-black object-contain`} />
  }

  if (ad.mediaType === 'image') {
    return <StaticMediaFrame src={ad.src} alt={ad.name || 'Patrocínio'} className={`${sizeClass} rounded-lg bg-black object-contain`} />
  }

  return <img src={ad.src} alt={ad.name || 'Patrocínio'} className={`${sizeClass} rounded-lg bg-black object-contain`} />
}

export function TypeBadge({ ad }) {
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

export function SponsorForm({ ad, setAd, getTypeDuration, onUpload }) {
  return (
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
        <Input type="file" accept={ad.mediaType === 'video' ? 'video/webm,video/mp4' : 'image/*'} onChange={(event) => onUpload(event.target.files?.[0], setAd)} />
      </div>

      <div className="space-y-2">
        <Label>Duração da exibição: {ad.duration}s</Label>
        <Slider value={[ad.duration]} onValueChange={([value]) => setAd((prev) => ({ ...prev, duration: value }))} min={3} max={120} step={1} />
      </div>

      {ad.src ? <MediaPreview ad={ad} /> : null}
    </div>
  )
}
