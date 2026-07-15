'use client'

import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import AppSidebar from '@/components/layout/app-sidebar'
import AppFooter from '@/components/shared/app-footer'
import { Button } from '@/components/ui/button'

export default function AppShell({ children }) {
  const [sidebarWidth, setSidebarWidth] = useState(64)
  const [isMobileAdmin, setIsMobileAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <AppSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      {isMobileAdmin ? (
        <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu principal">
            <Menu className="h-5 w-5" />
          </Button>
          <img src="/brand/icon-logo.svg" alt="" className="h-8 w-8 object-contain" />
          <span className="truncate text-sm font-semibold">Painel administrativo</span>
        </header>
      ) : null}
      <main
        className="flex min-h-screen min-w-0 flex-col items-center transition-sidebar"
        style={{
          marginLeft: isMobileAdmin ? 0 : sidebarWidth,
          width: isMobileAdmin ? '100%' : `calc(100% - ${sidebarWidth}px)`,
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
