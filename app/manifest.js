export default function manifest() {
  return {
    name: 'PASCOM Stream View',
    short_name: 'PASCOM',
    description: 'Página pública de patrocinadores, telão e transparência da PASCOM.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#1e40af',
    lang: 'pt-BR',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/brand/icon-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  }
}
