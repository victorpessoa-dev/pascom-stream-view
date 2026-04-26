'use client'

import OverlayEditor from '@/components/overlay-editor'
import { use } from 'react'

export default function EditorPage({ params }) {
  const resolvedParams = use(params)
  return <OverlayEditor overlayId={resolvedParams.id} />
}
