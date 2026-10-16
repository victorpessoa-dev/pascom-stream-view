export default function BrandLogo({
  className = "",
  alt = "Virtus PlayCast",
  markOnly = false,
  animated = false,
}) {
  const lightAsset = markOnly
    ? "/brand/virtus-playcast-mark.png"
    : "/brand/virtus-playcast-navy-text.png";
  const darkAsset = markOnly
    ? "/brand/virtus-playcast-white-mark.png"
    : "/brand/virtus-playcast-white.png";

  return (
    <span
      className={`relative inline-flex items-center ${animated ? "brand-logo-motion" : ""} ${className}`}
    >
      <img
        src={lightAsset}
        alt={alt}
        className="brand-logo-light h-full w-full object-contain"
      />
      <img
        src={darkAsset}
        alt=""
        className="brand-logo-dark absolute inset-0 h-full w-full object-contain"
      />
    </span>
  );
}
