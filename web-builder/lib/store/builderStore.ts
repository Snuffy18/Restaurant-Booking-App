'use client'

import { create } from 'zustand'
import { FloorElement, Floor, Guide, SaveStatus } from '@/types/floorplan'

const MAX_HISTORY = 50

interface BuilderState {
  elements: FloorElement[]
  selectedIds: string[]
  clipboard: FloorElement[]
  guides: Guide[]
  showGuides: boolean
  snapToGrid: boolean
  gridSize: number
  scale: number
  stagePos: { x: number; y: number }
  past: FloorElement[][]
  future: FloorElement[][]
  saveStatus: SaveStatus
  currentFloorId: string | null
  floors: Floor[]
  isDark: boolean

  resetCanvas: () => void
  setElements: (elements: FloorElement[]) => void
  addElement: (element: FloorElement) => void
  updateElement: (id: string, updates: Partial<FloorElement>) => void
  updateElements: (updates: { id: string; updates: Partial<FloorElement> }[]) => void
  deleteElement: (id: string) => void
  deleteSelected: () => void
  selectElement: (id: string | null) => void
  selectElements: (ids: string[]) => void
  copy: () => void
  paste: () => void
  addGuide: (id: string, axis: 'h' | 'v', position: number) => void
  updateGuide: (id: string, position: number) => void
  deleteGuide: (id: string) => void
  toggleGuides: () => void
  toggleSnap: () => void
  setScale: (scale: number) => void
  setStagePos: (pos: { x: number; y: number }) => void
  toggleDark: () => void
  undo: () => void
  redo: () => void
  setSaveStatus: (status: SaveStatus) => void
  setCurrentFloor: (floorId: string) => void
  setFloors: (floors: Floor[]) => void
  pushHistory: () => void
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  elements: [],
  selectedIds: [],
  clipboard: [],
  guides: [],
  showGuides: true,
  snapToGrid: true,
  gridSize: 20,
  scale: 1,
  stagePos: { x: 0, y: 0 },
  past: [],
  future: [],
  saveStatus: 'idle',
  currentFloorId: null,
  floors: [],
  isDark: (() => { try { return localStorage.getItem('builder-dark') === 'true' } catch { return false } })(),

  pushHistory: () => {
    const { elements, past } = get()
    set({ past: [...past, elements.map(el => ({ ...el }))].slice(-MAX_HISTORY), future: [] })
  },

  resetCanvas: () => set({
    elements: [], selectedIds: [], clipboard: [], guides: [],
    past: [], future: [], saveStatus: 'idle',
    currentFloorId: null, floors: [],
  }),

  setElements: (elements) => set({ elements }),

  addElement: (element) => {
    get().pushHistory()
    set((state) => ({ elements: [...state.elements, element] }))
  },

  updateElement: (id, updates) => {
    get().pushHistory()
    set((state) => ({ elements: state.elements.map(el => el.id === id ? { ...el, ...updates } : el) }))
  },

  updateElements: (updates) => {
    if (!updates.length) return
    get().pushHistory()
    const map = new Map(updates.map(u => [u.id, u.updates]))
    set((state) => ({ elements: state.elements.map(el => { const u = map.get(el.id); return u ? { ...el, ...u } : el }) }))
  },

  deleteElement: (id) => {
    get().pushHistory()
    set((state) => ({
      elements: state.elements.filter(el => el.id !== id),
      selectedIds: state.selectedIds.filter(s => s !== id),
    }))
  },

  deleteSelected: () => {
    const { selectedIds } = get()
    if (!selectedIds.length) return
    get().pushHistory()
    const del = new Set(selectedIds)
    set((state) => ({
      elements: state.elements.filter(el => !del.has(el.id) || el.locked),
      selectedIds: [],
    }))
  },

  selectElement: (id) => set({ selectedIds: id ? [id] : [] }),
  selectElements: (ids) => set({ selectedIds: ids }),

  copy: () => {
    const { selectedIds, elements } = get()
    const copied = elements.filter(el => selectedIds.includes(el.id))
    if (copied.length) set({ clipboard: copied })
  },

  paste: () => {
    const { clipboard } = get()
    if (!clipboard.length) return
    get().pushHistory()
    const newEls = clipboard.map(el => ({ ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20 }))
    set(s => ({
      elements: [...s.elements, ...newEls],
      selectedIds: newEls.map(el => el.id),
      clipboard: newEls, // offset on repeated paste
    }))
  },

  addGuide: (id, axis, position) => set(s => ({ guides: [...s.guides, { id, axis, position }] })),
  updateGuide: (id, position) => set(s => ({ guides: s.guides.map(g => g.id === id ? { ...g, position } : g) })),
  deleteGuide: (id) => set(s => ({ guides: s.guides.filter(g => g.id !== id) })),
  toggleGuides: () => set(s => ({ showGuides: !s.showGuides })),

  toggleSnap: () => set(state => ({ snapToGrid: !state.snapToGrid })),
  setScale: (scale) => set({ scale }),
  setStagePos: (stagePos) => set({ stagePos }),

  toggleDark: () => {
    const next = !get().isDark
    set({ isDark: next })
    try { localStorage.setItem('builder-dark', String(next)) } catch { /* */ }
  },

  undo: () => {
    const { past, elements, future } = get()
    if (!past.length) return
    set({
      elements: past[past.length - 1],
      past: past.slice(0, -1),
      future: [elements.map(el => ({ ...el })), ...future].slice(0, MAX_HISTORY),
      selectedIds: [],
    })
  },

  redo: () => {
    const { past, elements, future } = get()
    if (!future.length) return
    set({
      elements: future[0],
      past: [...past, elements.map(el => ({ ...el }))].slice(-MAX_HISTORY),
      future: future.slice(1),
      selectedIds: [],
    })
  },

  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setCurrentFloor: (floorId) => set({ currentFloorId: floorId }),
  setFloors: (floors) => set({ floors }),
}))
