export function isSafePublicUrl(url = '') {
  const value = String(url || '').trim()
  if (!value) return false

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
