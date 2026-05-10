'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/app-sidebar'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

export default function AppShell({ children }) {
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return

    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector('aside')
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth)
      }
    })

    const sidebar = document.querySelector('aside')
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] })
      setSidebarWidth(sidebar.offsetWidth)
    }

    return () => observer.disconnect()
  }, [isMobile])

  if (isMobile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <div className="text-lg font-semibold">Painel administrativo</div>
          <div className="mt-2 text-sm text-muted-foreground">
            O admin não está disponível em mobile. Acesse pelo computador.
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full">Dashboard público</Button>
            </Link>
            <Link href="/telao" className="flex-1">
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
      <main className="transition-sidebar" style={{ marginLeft: sidebarWidth }}>
        {children}
      </main>
    </div>
  )
}
