"use client";

import { Globe, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { getSocialIcon } from "@/components/shared/social-links";

export function SettingRow({ title, description, control }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{title}</Label>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {control}
    </div>
  );
}

export function SponsorDesignPreview({ title, settings }) {
  const modeEnabled = Boolean(settings.enabled);
  const width = modeEnabled ? (settings.contentWidth ?? 58) : 100;
  const height = modeEnabled ? (settings.contentHeight ?? 58) : 100;
  const top = modeEnabled ? (settings.y ?? 50) : 50;
  const left = modeEnabled ? (settings.x ?? 50) : 50;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
        {modeEnabled && settings.backgroundUrl ? (
          <img
            src={settings.backgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.08),_transparent)]" />
        )}

        <div
          className="absolute rounded-lg border-2 border-dashed border-primary bg-primary/15"
          style={{
            width: `${width}%`,
            height: `${height}%`,
            left: `${left}%`,
            top: `${top}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex h-full items-center justify-center text-center text-xs font-medium text-primary">
            Área da mídia
          </div>
        </div>
      </div>
    </div>
  );
}

export function DesignAdjustmentDrop({
  settings,
  onChange,
  onModeChange,
  onUpload,
  onRestore,
}) {
  const contentWidth = settings.contentWidth ?? 58;
  const contentHeight = settings.contentHeight ?? 58;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-6 flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="font-medium">Modelo único do telão</div>
          <div className="text-sm text-muted-foreground">
            Este fundo e esta área de mídia são aplicados a todos os patrocínios
            do telão público.
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRestore}
          className="shrink-0"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar área
        </Button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)] xl:items-start">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <SettingRow
              title="Ativar Modo com Fundo"
              description="Ativa uma imagem de fundo e libera o ajuste da área da mídia. Desativado, o conteúdo ocupa a tela completa."
              control={
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={onModeChange}
                />
              }
            />
          </div>

          {settings.enabled ? (
            <div className="animate-in space-y-4 fade-in slide-in-from-top-3 duration-300">
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div>
                  <Label>Fundo do telão</Label>
                  <p className="text-sm text-muted-foreground">
                    Use uma URL pública ou envie uma imagem. O resultado aparece
                    somente no preview.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Imagem de fundo</Label>
                    <Input
                      placeholder="https://exemplo.com/arte-fundo.png"
                      value={settings.backgroundUrl || ""}
                      onChange={(event) =>
                        onChange("backgroundUrl", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload da imagem</Label>
                    <FileDropzone
                      accept="image/*"
                      onFileSelect={onUpload}
                      title="Arraste uma imagem ou clique para enviar"
                      description="PNG, JPG, WebP ou SVG"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5 rounded-lg border border-border p-4">
                <div>
                  <Label>Área da mídia</Label>
                  <p className="text-sm text-muted-foreground">
                    Ajuste tamanho e posição do patrocinador sobre o fundo.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Largura · laterais</Label>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {contentWidth}%
                    </span>
                  </div>
                  <Slider
                    value={[contentWidth]}
                    onValueChange={([value]) => onChange("contentWidth", value)}
                    min={10}
                    max={100}
                    step={1}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Altura · cima/baixo</Label>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {contentHeight}%
                    </span>
                  </div>
                  <Slider
                    value={[contentHeight]}
                    onValueChange={([value]) =>
                      onChange("contentHeight", value)
                    }
                    min={10}
                    max={100}
                    step={1}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="grid grid-cols-1 gap-5 border-t border-border/70 pt-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Posição horizontal ({settings.x ?? 50}%)</Label>
                    <Slider
                      value={[settings.x ?? 50]}
                      onValueChange={([value]) => onChange("x", value)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Posição vertical ({settings.y ?? 50}%)</Label>
                    <Slider
                      value={[settings.y ?? 50]}
                      onValueChange={([value]) => onChange("y", value)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground fade-in slide-in-from-bottom-2 duration-300">
              Modo sem fundo ativo: a mídia ocupa toda a área do telão.
            </div>
          )}
        </div>

        <div className="xl:sticky xl:top-6">
          <SponsorDesignPreview title="Prévia do telão" settings={settings} />
        </div>
      </div>
    </div>
  );
}

const socialLabelMap = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  website: "Site",
};

function getVisibleSocialLinks(socialLinks = {}) {
  const fixedLinks = Object.entries(socialLinks)
    .filter(([key]) => key !== "extra")
    .map(([key, url]) => ({
      key,
      label: socialLabelMap[key] || key,
      url: String(url || "").trim(),
    }))
    .filter(({ url }) => url);

  const extraLinks = Array.isArray(socialLinks.extra) ? socialLinks.extra : [];

  return [
    ...fixedLinks,
    ...extraLinks
      .map((item, index) => ({
        key: `extra-${index}`,
        label: String(item?.label || "Link").trim(),
        url: String(item?.url || "").trim(),
      }))
      .filter(({ url }) => url),
  ];
}

export function BrandPreview({
  parishName,
  parishLogoUrl,
  parishCoverUrl = "",
  parishCity = "",
  socialLinks = {},
}) {
  const visibleSocialLinks = getVisibleSocialLinks(socialLinks);

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4">
      <div className="text-sm font-medium">Prévia da marca</div>
      <div className="mt-4 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar">
        <div className="relative min-h-52 bg-sidebar-accent sm:min-h-60">
          {parishCoverUrl ? (
            <img
              src={parishCoverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_34%),linear-gradient(135deg,_rgba(59,130,246,0.30),_rgba(15,23,42,0.7))]" />
          )}
          <div
            className={
              parishCoverUrl
                ? "absolute inset-0 bg-black/30"
                : "absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            }
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3 pr-12 text-left sm:gap-4 sm:pr-32">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-primary sm:h-20 sm:w-20">
                <img
                  src={parishLogoUrl || "/brand/virtus-playcast-mark.png"}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 text-white drop-shadow">
                <div className="max-w-[16rem] truncate text-sm font-semibold tracking-tight sm:max-w-[34rem] sm:text-lg">
                  {parishName || "Nome da paróquia"}
                </div>
                {parishCity ? (
                  <div className="mt-1 truncate text-xs text-white/75">
                    {parishCity}
                  </div>
                ) : null}
              </div>
            </div>
            {visibleSocialLinks.length > 0 ? (
              <div className="absolute bottom-4 right-4 flex max-w-[44%] flex-wrap justify-end gap-1.5 sm:bottom-5 sm:right-5 sm:max-w-xs">
                {visibleSocialLinks.map(({ key, label }) => {
                  const Icon = getSocialIcon(label) || Globe;

                  return (
                    <span
                      key={key}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 sm:h-8 sm:w-8"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="sr-only">{label || "Link"}</span>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
