'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/app-sidebar'
import { cn } from '@/lib/utils'

export default function AppShell({ children }) {
  const [sidebarWidth, setSidebarWidth] = useState(260)

  useEffect(() => {
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
