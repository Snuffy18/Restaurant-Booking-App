'use client'

import type { ElementType } from '@/types/floorplan'

interface PaletteItem {
  type: ElementType
  label: string
  icon: React.ReactNode
  color: string
}

const PALETTE: PaletteItem[] = [
  {
    type: 'table-round',
    label: 'Round table',
    color: '#fef3c7',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    type: 'table-rect',
    label: 'Rect table',
    color: '#fef3c7',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="3" y="6" width="18" height="12" rx="2" />
      </svg>
    ),
  },
  {
    type: 'table-square',
    label: 'Square table',
    color: '#fef3c7',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
    ),
  },
  {
    type: 'wall',
    label: 'Wall',
    color: '#374151',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="2" y="10" width="20" height="4" rx="1" />
      </svg>
    ),
  },
  {
    type: 'zone',
    label: 'Zone',
    color: '#93c5fd',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 2" />
      </svg>
    ),
  },
  {
    type: 'bar',
    label: 'Bar',
    color: '#c4b5fd',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="3" y="8" width="18" height="8" rx="2" />
        <rect x="7" y="4" width="2" height="5" rx="1" />
        <rect x="15" y="4" width="2" height="5" rx="1" />
      </svg>
    ),
  },
  {
    type: 'plant',
    label: 'Plant',
    color: '#6ee7b7',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="12" cy="10" r="5" />
        <rect x="11" y="14" width="2" height="6" rx="1" />
      </svg>
    ),
  },
  {
    type: 'couch',
    label: 'Couch',
    color: '#fcd34d',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="2" y="9" width="20" height="10" rx="3" />
        <rect x="5" y="7" width="14" height="5" rx="2" />
      </svg>
    ),
  },
]

const SECTIONS = [
  { label: 'Tables', types: ['table-round', 'table-rect', 'table-square'] },
  { label: 'Structure', types: ['wall', 'zone'] },
  { label: 'Decor', types: ['bar', 'plant', 'couch'] },
]

function PaletteItemCard({ item }: { item: PaletteItem }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('elementType', item.type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none"
      title={`Drag to place ${item.label}`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: item.color + '99', color: item.color === '#374151' ? '#fff' : '#374151' }}
      >
        {item.icon}
      </div>
      <span className="text-xs text-gray-600 text-center leading-tight">{item.label}</span>
    </div>
  )
}

export default function Sidebar() {
  const byType = Object.fromEntries(PALETTE.map((p) => [p.type, p]))

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
      <div className="p-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Elements</p>
      </div>
      <div className="p-3 space-y-4 flex-1">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-medium text-gray-400 mb-2">{section.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {section.types.map((type) => {
                const item = byType[type]
                return item ? <PaletteItemCard key={type} item={item} /> : null
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">Drag items onto canvas</p>
        <p className="text-xs text-gray-300 text-center mt-0.5">Space + drag to pan · scroll to zoom</p>
      </div>
    </aside>
  )
}
