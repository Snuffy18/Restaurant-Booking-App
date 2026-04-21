'use client'

import { useBuilderStore } from '@/lib/store/builderStore'

const TYPE_LABELS: Record<string, string> = {
  'table-round': 'Round Table',
  'table-rect': 'Rectangular Table',
  'table-square': 'Square Table',
  'wall': 'Wall',
  'zone': 'Zone',
  'bar': 'Bar',
  'plant': 'Plant',
  'couch': 'Couch',
}

const ZONE_PRESETS = ['Indoor', 'Outdoor', 'Terrace', 'VIP', 'Bar area', 'Private dining']

export default function PropertiesPanel() {
  const { selectedId, elements, updateElement, deleteElement } = useBuilderStore()

  const element = elements.find((el) => el.id === selectedId)

  if (!element) return null

  const isTable = element.type.startsWith('table')

  return (
    <div className="absolute bottom-0 left-52 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div className="flex items-center gap-4 px-4 py-3 max-w-full overflow-x-auto">
        <div className="shrink-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {TYPE_LABELS[element.type] ?? element.type}
          </span>
        </div>

        <div className="w-px h-8 bg-gray-200 shrink-0" />

        <div className="flex items-center gap-1.5 shrink-0">
          <label className="text-xs text-gray-500 whitespace-nowrap">Label</label>
          <input
            type="text"
            value={element.label ?? ''}
            onChange={(e) => updateElement(element.id, { label: e.target.value })}
            className="w-24 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="e.g. T1"
          />
        </div>

        {isTable && (
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-xs text-gray-500 whitespace-nowrap">Capacity</label>
            <input
              type="number"
              min={1}
              max={20}
              value={element.capacity ?? 2}
              onChange={(e) => updateElement(element.id, { capacity: parseInt(e.target.value) || 2 })}
              className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <span className="text-xs text-gray-400">seats</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <label className="text-xs text-gray-500 whitespace-nowrap">Zone</label>
          <input
            list="zone-presets"
            type="text"
            value={element.zone ?? ''}
            onChange={(e) => updateElement(element.id, { zone: e.target.value })}
            className="w-28 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="Indoor"
          />
          <datalist id="zone-presets">
            {ZONE_PRESETS.map((z) => <option key={z} value={z} />)}
          </datalist>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <label className="text-xs text-gray-500 whitespace-nowrap">Color</label>
          <input
            type="color"
            value={element.color ?? '#fef3c7'}
            onChange={(e) => updateElement(element.id, { color: e.target.value })}
            className="w-8 h-7 rounded cursor-pointer border border-gray-200 p-0.5"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <label className="text-xs text-gray-500 whitespace-nowrap">Tags</label>
          <input
            type="text"
            value={(element.tags ?? []).join(', ')}
            onChange={(e) =>
              updateElement(element.id, {
                tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
              })
            }
            className="w-36 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="window, quiet"
          />
        </div>

        <div className="w-px h-8 bg-gray-200 shrink-0" />

        <div className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
          {Math.round(element.x)}, {Math.round(element.y)} · {Math.round(element.width)}×{Math.round(element.height)}
          {element.rotation ? ` · ${Math.round(element.rotation)}°` : ''}
        </div>

        <div className="ml-auto shrink-0">
          <button
            onClick={() => deleteElement(element.id)}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
