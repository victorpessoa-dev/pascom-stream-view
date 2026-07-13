import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  applicationName: 'PASCOM Stream View',
  title: {
    default: 'PASCOM Stream View',
    template: '%s | PASCOM Stream View',
  },
  description: 'Página pública de patrocinadores, telão e transparência da PASCOM.',
  keywords: ['pascom', 'patrocinadores', 'telão', 'paróquia', 'transmissão ao vivo'],
  authors: [{ name: 'PASCOM' }],
  creator: 'PASCOM',
  publisher: 'PASCOM',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/brand/icon-logo.svg',
    shortcut: '/brand/icon-logo.svg',
    apple: '/brand/icon-logo.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'PASCOM Stream View',
    title: 'PASCOM Stream View',
    description: 'Página pública de patrocinadores, telão e transparência da PASCOM.',
    images: [
      {
        url: '/brand/emblema-16-9.svg',
        width: 1080,
        height: 358,
        alt: 'PASCOM Stream View',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'PASCOM Stream View',
    description: 'Página pública de patrocinadores, telão e transparência da PASCOM.',
    images: ['/brand/emblema-16-9.svg'],
  },
}

export const viewport = {
  themeColor: '#1e40af',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark bg-background">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
