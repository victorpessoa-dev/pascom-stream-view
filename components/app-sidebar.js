'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Monitor,
  Play,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useStore } from '@/lib/store'

const navItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Overlay', href: '/overlay', icon: Monitor },
  { title: 'Painel do Telão', href: '/painel-telao', icon: Megaphone },
  { title: 'Configurações', href: '/configuracoes', icon: Settings },
]

const publicLinks = [
  { title: 'Dashboard público', href: '/dashboard', icon: Globe },
  { title: 'Abrir /telao', href: '/telao', icon: Play, target: '_blank' },
  { title: 'Abrir /telao-master', href: '/telao-master', icon: Play, target: '_blank' },
]

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { overlays, ads, isLoaded, adminSettings } = useStore()
  const parishName = adminSettings?.appearance?.parishName?.trim()
  const parishLogoUrl = adminSettings?.appearance?.parishLogoUrl?.trim()

  async function onLogout() {
    try {
      await fetch('/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-sidebar',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary">
            {parishLogoUrl ? (
              <img src={parishLogoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Monitor className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">PASCOM <span className="text-[11px] font-medium uppercase tracking-wide text-sidebar-muted">Stream View</span></span>

              {parishName ? (
                <span className="mt-1 text-[11px] font-medium text-sidebar-foreground/70">{parishName}</span>
              ) : null}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const badgeValue =
              item.href === '/overlay'
                ? overlays.length
                : item.href === '/painel-telao'
                  ? ads.filter((ad) => ad.active).length
                  : 0

            const navButton = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {isLoaded && badgeValue > 0 ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-[10px] font-semibold text-sidebar-accent-foreground">
                        {badgeValue}
                      </span>
                    ) : null}
                  </>
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{item.title}</TooltipContent>
                </Tooltip>
              )
            }

            return navButton
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border px-3 py-4">
          {publicLinks.map((item) => {
            const quickLink = (
              <Link
                key={item.href}
                href={item.href}
                target={item.target}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.target ? <ExternalLink className="h-4 w-4 opacity-50" /> : null}
                  </>
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{quickLink}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{item.title}</TooltipContent>
                </Tooltip>
              )
            }

            return quickLink
          })}
        </div>

        <div className="border-t border-sidebar-border px-3 py-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center justify-center rounded-lg p-2.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
