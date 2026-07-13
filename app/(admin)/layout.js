'use client'

import { Toaster } from 'sonner'
import { StoreProvider } from '@/lib/store/store'

export default function AdminLayout({ children }) {
  return (
    <StoreProvider>
      {children}
      <Toaster
        closeButton
        richColors
        theme="dark"
        position="bottom-right"
        duration={3600}
        toastOptions={{
          classNames: {
            toast: 'border border-border bg-card text-card-foreground shadow-xl',
            title: 'font-medium',
            description: 'text-muted-foreground',
          },
        }}
      />
    </StoreProvider>
  )
}
