'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/layout/app-sidebar'
import AppFooter from '@/components/shared/app-footer'
import { Button } from '@/components/ui/button'

export default function AppShell({ children }) {
  const [sidebarWidth, setSidebarWidth] = useState(72)
  const [isMobileAdmin, setIsMobileAdmin] = useState(false)

  useEffect(() => {
    const updateWidth = () => {
      const sidebar = document.querySelector('aside')
      setIsMobileAdmin(window.innerWidth < 768)
      setSidebarWidth(window.innerWidth >= 768 && sidebar ? sidebar.offsetWidth : 0)
    }

    const observer = new MutationObserver(updateWidth)
    const sidebar = document.querySelector('aside')

    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] })
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    window.addEventListener('pascom_sidebar_resize', updateWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
      window.removeEventListener('pascom_sidebar_resize', updateWidth)
    }
  }, [])

  if (isMobileAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-xl">
          <img src="/brand/icon-logo.svg" alt="" className="mx-auto h-12 w-12 object-contain" />
          <h1 className="mt-5 text-xl font-semibold text-foreground">Painel administrativo</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O admin nao funciona em modo mobile. Acesse pelo computador ou por uma tela maior.
          </p>
          <div className="mt-6 grid gap-2">
            <Button asChild>
              <Link href="/">Pagina publica</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/telao">Abrir telao</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <AppSidebar />
      <main
        className="flex min-h-screen min-w-0 flex-col items-center transition-sidebar"
        style={{
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        <div className="flex min-h-screen w-full min-w-0 flex-col">
          {children}
          <AppFooter className="mt-auto" />
        </div>
      </main>
    </div>
  )
}
