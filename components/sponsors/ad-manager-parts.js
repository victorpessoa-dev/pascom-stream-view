"use client";

import { useState } from "react";
import { Image as ImageIcon, Trash2, Video, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaticMediaFrame from "@/components/shared/static-media-frame";
import { useMediaBackgroundColor } from "@/components/sponsors/telao-media";
import { getYouTubeThumbnail } from "@/lib/utils/video-source";

export function MediaPreview({ ad, compact = false }) {
  const sizeClass = compact ? "h-14 w-20" : "aspect-video w-full";
  const backgroundColor = useMediaBackgroundColor(ad?.src, ad?.mediaType);
  const backgroundStyle = {
    backgroundColor,
    backgroundImage: `radial-gradient(circle at center, color-mix(in srgb, ${backgroundColor} 82%, white 18%), ${backgroundColor})`,
  };

  if (!ad.src) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-muted ${sizeClass}`}
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }

  if (ad.mediaType === "video") {
    const youtubeThumbnail = getYouTubeThumbnail(ad.src);
    return (
      <div
        className={`${sizeClass} shrink-0 overflow-hidden rounded-lg`}
        style={backgroundStyle}
      >
        {youtubeThumbnail ? (
          <img
            src={youtubeThumbnail}
            alt={`Prévia de ${ad.name || "vídeo"}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <StaticMediaFrame
            src={ad.src}
            type="video"
            className="h-full w-full object-contain"
          />
        )}
      </div>
    );
  }

  if (ad.mediaType === "image") {
    return (
      <div
        className={`${sizeClass} shrink-0 overflow-hidden rounded-lg`}
        style={backgroundStyle}
      >
        <StaticMediaFrame
          src={ad.src}
          alt={ad.name || "Patrocínio"}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-lg`}
      style={backgroundStyle}
    >
      <img
        src={ad.src}
        alt={ad.name || "Patrocínio"}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export function TypeBadge({ ad }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        className={ad.type === "MASTER" ? "bg-yellow-500 text-yellow-950" : ""}
      >
        {ad.type === "MASTER" ? <Zap className="mr-1 h-3 w-3" /> : null}
        {ad.type}
      </Badge>
      <Badge variant="secondary">
        {ad.mediaType === "video" ? (
          <Video className="mr-1 h-3 w-3" />
        ) : (
          <ImageIcon className="mr-1 h-3 w-3" />
        )}
        {ad.mediaType === "video" ? "Vídeo" : "Imagem"}
      </Badge>
    </div>
  );
}

export function SponsorForm({
  ad,
  setAd,
  getTypeDuration,
  onUpload,
  onUploadStateChange,
  allowMediaRemoval = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const hasUploadedMedia = ad.sourceType === "upload" && Boolean(ad.src);
  const isMaster = ad.type === "MASTER";
  const durationLimit = Math.max(3, Number(getTypeDuration(ad.type)) || 3);
  const displayedDuration = Math.min(
    durationLimit,
    Math.max(3, Number(ad.duration) || 3),
  );

  const handleUpload = async (file) => {
    if (!file) return;

    const isVideo = file.type?.startsWith("video/");
    if (isVideo && !isMaster) {
      setUploadError("Upload de vídeo é exclusivo para patrocinadores MASTER.");
      return;
    }

    setUploadError("");
    setUploading(true);
    onUploadStateChange?.(true);
    try {
      await onUpload(file, setAd);
    } finally {
      setUploading(false);
      onUploadStateChange?.(false);
    }
  };

  return (
    <Tabs defaultValue="data" className="py-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="data">Dados</TabsTrigger>
        <TabsTrigger value="media">Mídia e prévia</TabsTrigger>
      </TabsList>

      <TabsContent value="data" className="mt-5 space-y-5">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={ad.name}
            onChange={(e) =>
              setAd((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Site do anunciante</Label>
          <Input
            type="url"
            placeholder="https://loja.com.br ou https://instagram.com/perfil"
            value={ad.websiteUrl || ""}
            onChange={(e) =>
              setAd((prev) => ({ ...prev, websiteUrl: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={ad.type}
            onValueChange={(value) =>
              setAd((prev) => ({
                ...prev,
                type: value,
                duration: getTypeDuration(value),
                ...(value === "NORMAL" && prev.mediaType === "video"
                  ? { mediaType: "image", src: "", sourceType: "link" }
                  : {}),
              }))
            }
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
          <Label>Duração da exibição: {displayedDuration}s</Label>
          <Slider
            value={[displayedDuration]}
            onValueChange={([value]) =>
              setAd((prev) => ({ ...prev, duration: value }))
            }
            min={3}
            max={durationLimit}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            Limite do tipo {ad.type}: {durationLimit}s.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="media" className="mt-5 space-y-5">
        <div className="space-y-2">
          <Label>Mídia</Label>
          <Select
            value={ad.mediaType}
            onValueChange={(value) =>
              setAd((prev) => ({ ...prev, mediaType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Imagem</SelectItem>
              <SelectItem value="video" disabled={!isMaster}>
                Vídeo · MASTER
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Link da mídia</Label>
          <Input
            placeholder={
              ad.mediaType === "video"
                ? "https://exemplo.com/video.mp4"
                : "https://exemplo.com/imagem.png"
            }
            value={ad.src || ""}
            readOnly={hasUploadedMedia}
            onChange={(e) =>
              setAd((prev) => ({
                ...prev,
                src: e.target.value,
                sourceType: "link",
              }))
            }
          />
          {hasUploadedMedia ? (
            <p className="text-xs text-muted-foreground">
              Upload anexado. Clique em Salvar para gravar esta mídia no
              patrocínio.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Upload</Label>
          <FileDropzone
            accept={
              isMaster
                ? "image/gif,image/jpeg,image/png,image/webp,video/webm,video/mp4"
                : "image/gif,image/jpeg,image/png,image/webp"
            }
            disabled={uploading}
            onFileSelect={handleUpload}
            title="Arraste a mídia ou clique para enviar"
            description={
              isMaster
                ? "Imagens, MP4 ou WebM"
                : "Imagens GIF, JPG, PNG ou WebP"
            }
          />
          <p className="text-xs text-muted-foreground">
            {isMaster
              ? "MASTER aceita imagens e vídeos MP4/WebM."
              : "NORMAL aceita somente imagens. Para enviar vídeo, selecione MASTER."}
          </p>
          {uploadError ? (
            <p className="text-xs font-medium text-destructive">
              {uploadError}
            </p>
          ) : null}
          {uploading ? (
            <p className="text-xs text-muted-foreground">Enviando arquivo...</p>
          ) : null}
        </div>

        {ad.src ? (
          <div className="space-y-3">
            <MediaPreview ad={ad} />
            {allowMediaRemoval ? (
              <Button
                type="button"
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => {
                  if (
                    !window.confirm(
                      "Remover a mídia atual? O arquivo será excluído do armazenamento depois que a nova mídia for salva.",
                    )
                  )
                    return;
                  setAd((prev) => ({ ...prev, src: "", sourceType: "link" }));
                  setUploadError("");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover mídia atual
              </Button>
            ) : null}
          </div>
        ) : allowMediaRemoval ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Mídia removida. Adicione um novo link ou faça outro upload antes de
            salvar.
          </p>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
