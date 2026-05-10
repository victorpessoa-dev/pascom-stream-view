import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { StoreProvider } from '@/lib/store'
import './globals.css'

export const metadata = {
  title: 'PASCOM Stream View',
  description: 'Crie overlays dinâmicos e profissionais para suas transmissões ao vivo',
  keywords: ['overlay', 'stream', 'twitch', 'obs', 'broadcast', 'live', 'pascom'],
}

export const viewport = {
  themeColor: '#1e40af',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark bg-background">
      <body className="font-sans antialiased">
        <StoreProvider>
          {children}
        </StoreProvider>
        <Toaster
          position="bottom-right"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            },
          }}
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
