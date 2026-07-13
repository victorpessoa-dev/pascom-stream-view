'use client'

import { StoreProvider } from '@/lib/store/store'

export default function AdminLayout({ children }) {
  return <StoreProvider>{children}</StoreProvider>
}
