'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import AppShell from '@/components/app-shell'
import OverlayList from '@/components/overlay-list'
import CreateOverlayDialog from '@/components/create-overlay-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function OverlaysPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Overlays</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus overlays para transmissoes
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Overlay
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar overlays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* List */}
        <OverlayList searchQuery={searchQuery} />

        <CreateOverlayDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </AppShell>
  )
}
