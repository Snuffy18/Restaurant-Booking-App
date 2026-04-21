'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const CanvasInner = dynamic(() => import('./CanvasInner'), { ssr: false })

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden">
      <CanvasInner width={size.width} height={size.height} />
    </div>
  )
}
