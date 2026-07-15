'use client'

import { usePreventBrowserZoom } from '@/hooks/use-prevent-browser-zoom'

export default function BrowserZoomGuard() {
  usePreventBrowserZoom()
  return null
}
