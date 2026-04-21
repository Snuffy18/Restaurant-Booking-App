'use client'

import { useBuilderStore } from '@/lib/store/builderStore'
import type { Floor, SaveStatus } from '@/types/floorplan'

interface Props {
  restaurantName: string
  floors: Floor[]
  currentFloorId: string | null
  saveStatus: SaveStatus
  isAdmin: boolean
  onFloorChange: (id: string) => void
  onAddFloor: () => void
  onSave: () => void
  onDeleteFloor: () => void
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  if (status === 'saving') return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
      Saving...
    </span>
  )
  if (status === 'saved') return (
    <span className="flex items-center gap-1.5 text-xs text-green-600">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      Autosaved
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-500">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Error — retry
    </span>
  )
}

export default function Toolbar({
  restaurantName,
  floors,
  currentFloorId,
  saveStatus,
  isAdmin,
  onFloorChange,
  onAddFloor,
  onSave,
  onDeleteFloor,
}: Props) {
  const { snapToGrid, toggleSnap, undo, redo, past, future } = useBuilderStore()

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0 z-10">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 text-sm truncate">{restaurantName}</span>
        {isAdmin && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Admin</span>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-1.5">
        <select
          value={currentFloorId ?? ''}
          onChange={(e) => onFloorChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2.5 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          {floors.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <button
          onClick={onAddFloor}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1 hover:border-gray-300 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add floor
        </button>
        {floors.length > 1 && (
          <button
            onClick={onDeleteFloor}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1 hover:border-red-300 transition-colors"
          >
            Delete floor
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={past.length === 0}
          title="Undo (⌘Z)"
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (⌘⇧Z)"
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <button
        onClick={toggleSnap}
        className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 border transition-colors ${
          snapToGrid
            ? 'bg-gray-900 text-white border-gray-900'
            : 'text-gray-600 border-gray-200 hover:border-gray-300'
        }`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Grid {snapToGrid ? 'ON' : 'OFF'}
      </button>

      <div className="ml-auto flex items-center gap-3">
        <SaveIndicator status={saveStatus} />
        <button
          onClick={onSave}
          className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Save
        </button>
      </div>
    </header>
  )
}
