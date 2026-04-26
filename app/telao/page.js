'use client'

import { Play, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/app-shell'
import AdManager from '@/components/ad-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/lib/store'

export default function TelaoPage() {
  const { ads, isLoaded } = useStore()

  const activeAds = ads.filter(a => a.active).length

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Telao / Propaganda</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas propagandas para o telao
            </p>
          </div>
          <Link href="/telao/visualizar" target="_blank">
            <Button className="gap-2">
              <Play className="w-4 h-4" />
              Abrir Telao
              <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {isLoaded && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{ads.length}</div>
                <p className="text-sm text-muted-foreground">Total de propagandas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{activeAds}</div>
                <p className="text-sm text-muted-foreground">Propagandas ativas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{ads.length - activeAds}</div>
                <p className="text-sm text-muted-foreground">Propagandas inativas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manager */}
        <AdManager />
      </div>
    </AppShell>
  )
}
