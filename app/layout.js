import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { StoreProvider } from '@/lib/store'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata = {
  title: 'PASCOM Stream View',
  description: 'Crie overlays dinamicos e profissionais para suas transmissoes ao vivo',
  keywords: ['overlay', 'stream', 'twitch', 'obs', 'broadcast', 'live', 'pascom'],
}

export const viewport = {
  themeColor: '#1e40af',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark bg-background">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
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
