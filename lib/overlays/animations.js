export const OVERLAY_ANIMATION_OPTIONS = [
  { value: "none", label: "Sem animação" },
  { value: "fade", label: "Fade suave" },
  { value: "fade-up", label: "Subir com fade" },
  { value: "slide-left", label: "Entrar pela esquerda" },
  { value: "slide-right", label: "Entrar pela direita" },
  { value: "slide-down", label: "Entrar por cima" },
  { value: "zoom", label: "Zoom de entrada" },
  { value: "bounce", label: "Entrada elástica" },
  { value: "pulse", label: "Pulso contínuo" },
];

const LEGACY_ANIMATIONS = {
  "fade-in": "fade",
  "fade-in-up": "fade-up",
  "slide-in-from-left": "slide-left",
  "pulse-slow": "pulse",
};

export function normalizeOverlayAnimation(animation) {
  return LEGACY_ANIMATIONS[animation] || animation || "none";
}

export function getOverlayAnimationClass(animation) {
  const normalized = normalizeOverlayAnimation(animation);
  return normalized === "none" ? "" : `overlay-motion-${normalized}`;
}

export function getOverlayElementKey(element) {
  return [
    element.id,
    element.visible,
    element.animationType,
    element.src,
    element.text,
    element.x,
    element.y,
    element.width,
    element.height,
    element.fontSize,
    element.fontColor,
  ].join(":");
}

export function getOverlayMediaType(element) {
  if (element.mediaType === "video") return "video";
  return /\.(mp4|webm|ogg|mov)(?:$|[?#])/i.test(element.src || "")
    ? "video"
    : "image";
}

export function getOverlayBackground(value) {
  const background = String(value || "").trim();
  if (!background) return "transparent";

  return /^(transparent|[a-z]+|#[0-9a-f]{3,8}|rgba?\([\d.,\s%]+\)|hsla?\([\d.,\s%]+\))$/i.test(
    background,
  )
    ? background
    : "transparent";
}

export function getOverlayOutputUrl(path, background = "") {
  const outputPath = String(path || "").trim();
  const requestedBackground = String(background || "").trim();
  const safeBackground = getOverlayBackground(requestedBackground);

  if (!outputPath || !requestedBackground || safeBackground === "transparent") {
    return outputPath;
  }

  const separator = outputPath.includes("?") ? "&" : "?";
  return `${outputPath}${separator}bgcolor=${encodeURIComponent(safeBackground)}`;
}
