/**
 * The home hero always sits on a dark photographic background. It therefore
 * uses a fixed high-contrast asset instead of the theme-aware logo used by
 * cards, navigation and other page surfaces.
 */
export default function HeroBrandLogo({
  className = "",
  alt = "Virtus PlayCast",
}) {
  return (
    <img
      src="/brand/virtus-playcast-color.png"
      alt={alt}
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
