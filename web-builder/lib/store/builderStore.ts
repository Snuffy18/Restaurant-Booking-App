'use client'

import { create } from 'zustand'
import { FloorElement, Floor, SaveStatus } from '@/types/floorplan'

const MAX_HISTORY = 50

interface BuilderState {
  elements: FloorElement[]
  selectedIds: string[]
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

  setElements: (elements: FloorElement[]) => void
  addElement: (element: FloorElement) => void
  updateElement: (id: string, updates: Partial<FloorElement>) => void
  updateElements: (updates: { id: string; updates: Partial<FloorElement> }[]) => void
  deleteElement: (id: string) => void
  deleteSelected: () => void
  selectElement: (id: string | null) => void
  selectElements: (ids: string[]) => void
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
    const snapshot = elements.map((el) => ({ ...el }))
    set({ past: [...past, snapshot].slice(-MAX_HISTORY), future: [] })
  },

  setElements: (elements) => set({ elements }),

  addElement: (element) => {
    get().pushHistory()
    set((state) => ({ elements: [...state.elements, element] }))
  },

  updateElement: (id, updates) => {
    get().pushHistory()
    set((state) => ({
      elements: state.elements.map((el) => el.id === id ? { ...el, ...updates } : el),
    }))
  },

  updateElements: (updates) => {
    if (updates.length === 0) return
    get().pushHistory()
    const map = new Map(updates.map((u) => [u.id, u.updates]))
    set((state) => ({
      elements: state.elements.map((el) => {
        const u = map.get(el.id)
        return u ? { ...el, ...u } : el
      }),
    }))
  },

  deleteElement: (id) => {
    get().pushHistory()
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }))
  },

  deleteSelected: () => {
    const { selectedIds } = get()
    if (selectedIds.length === 0) return
    get().pushHistory()
    const toDelete = new Set(selectedIds)
    set((state) => ({
      elements: state.elements.filter((el) => !toDelete.has(el.id)),
      selectedIds: [],
    }))
  },

  selectElement: (id) => set({ selectedIds: id ? [id] : [] }),

  selectElements: (ids) => set({ selectedIds: ids }),

  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setScale: (scale) => set({ scale }),

  setStagePos: (stagePos) => set({ stagePos }),

  toggleDark: () => {
    const next = !get().isDark
    set({ isDark: next })
    try { localStorage.setItem('builder-dark', String(next)) } catch { /* */ }
  },

  undo: () => {
    const { past, elements, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set({
      elements: previous,
      past: past.slice(0, -1),
      future: [elements.map((el) => ({ ...el })), ...future].slice(0, MAX_HISTORY),
      selectedIds: [],
    })
  },

  redo: () => {
    const { past, elements, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      elements: next,
      past: [...past, elements.map((el) => ({ ...el }))].slice(-MAX_HISTORY),
      future: future.slice(1),
      selectedIds: [],
    })
  },

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  setCurrentFloor: (floorId) => set({ currentFloorId: floorId }),

  setFloors: (floors) => set({ floors }),
}))
