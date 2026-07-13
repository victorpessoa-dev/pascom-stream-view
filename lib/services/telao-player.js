export const emptyTelaoSettings = {
  metricsEnabled: false,
  designs: {
    MASTER: {},
    NORMAL: {},
  },
}

export function shuffleArray(items, random = Math.random) {
  const cloned = [...items]
  for (let index = 1; index < cloned.length; index += 1) {
    const randomIndex = Math.floor(random() * index)
    ;[cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]]
  }
  return cloned
}

export function getDesignValue(design, key, fallbackKey, defaultValue) {
  if (design?.[key] != null) return design[key]
  if (fallbackKey && design?.[fallbackKey] != null) return design[fallbackKey]
  return defaultValue
}

export function buildAdsSignature(items) {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      updatedAt: item.updatedAt || null,
      duration: item.duration,
      active: item.active,
      src: item.src,
      type: item.type,
    }))
  )
}
