'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/app-sidebar'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AppShell({ children }) {
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector('aside')
      if (sidebar) {
        const width = sidebar.offsetWidth
        setSidebarWidth(width)
      }
    })

    const sidebar = document.querySelector('aside')
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] })
      setSidebarWidth(sidebar.offsetWidth)
    }

    return () => observer.disconnect()
  }, [])

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6">
          <div className="text-lg font-semibold">Painel administrativo</div>
          <div className="text-sm text-muted-foreground mt-2">
            O admin não está disponível em mobile. Acesse pelo computador.
          </div>
          <div className="flex gap-3 mt-6">
            <Link href="/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full">Dashboard público</Button>
            </Link>
            <Link href="/telao/visualizar" className="flex-1">
              <Button className="w-full">Abrir telão</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main 
        className="transition-sidebar"
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  )
}
