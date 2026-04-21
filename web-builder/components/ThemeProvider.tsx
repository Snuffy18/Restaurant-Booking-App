'use client'

import { useEffect } from 'react'
import { useBuilderStore } from '@/lib/store/builderStore'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useBuilderStore((s) => s.isDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return <>{children}</>
}
