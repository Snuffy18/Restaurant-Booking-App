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
    <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
      Saving...
    </span>
  )
  if (status === 'saved') return (
    <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
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
  const { snapToGrid, toggleSnap, undo, redo, past, future, scale, setScale, isDark, toggleDark, showGuides, toggleGuides } = useBuilderStore()

  return (
    <header className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 shrink-0 z-10">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 bg-gray-900 dark:bg-gray-100 rounded flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{restaurantName}</span>
        {isAdmin && (
          <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">Admin</span>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-center gap-1.5">
        <select
          value={currentFloorId ?? ''}
          onChange={(e) => onFloorChange(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent"
        >
          {floors.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <button
          onClick={onAddFloor}
          className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add floor
        </button>
        {floors.length > 1 && (
          <button
            onClick={onDeleteFloor}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1 hover:border-red-300 dark:hover:border-red-700 transition-colors"
          >
            Delete floor
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={past.length === 0}
          title="Undo (⌘Z)"
          className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (⌘⇧Z)"
          className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

      <button
        onClick={toggleSnap}
        className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 border transition-colors ${
          snapToGrid
            ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
            : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
        }`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Grid {snapToGrid ? 'ON' : 'OFF'}
      </button>

      <button
        onClick={toggleGuides}
        className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 border transition-colors ${
          showGuides
            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
        }`}
        title="Toggle guide lines (drag from rulers to create)"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M12 4v16" />
        </svg>
        Guides
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setScale(Math.max(0.1, scale - 0.25))}
          className="w-5 h-5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-base leading-none"
          title="Zoom out"
        >−</button>
        <input
          type="range"
          min={10}
          max={300}
          step={5}
          value={Math.round(scale * 100)}
          onChange={(e) => setScale(Number(e.target.value) / 100)}
          className="w-20 h-1 accent-gray-900 dark:accent-gray-300 cursor-pointer"
          title="Zoom"
        />
        <button
          onClick={() => setScale(Math.min(5, scale + 0.25))}
          className="w-5 h-5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-base leading-none"
          title="Zoom in"
        >+</button>
        <span className="text-xs text-gray-400 dark:text-gray-500 w-9 text-right tabular-nums">{Math.round(scale * 100)}%</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <SaveIndicator status={saveStatus} />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <button
          onClick={onSave}
          className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Save
        </button>
      </div>
    </header>
  )
}
