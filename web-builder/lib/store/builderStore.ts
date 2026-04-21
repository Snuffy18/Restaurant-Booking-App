'use client'

import { create } from 'zustand'
import { FloorElement, Floor, SaveStatus } from '@/types/floorplan'

const MAX_HISTORY = 50

interface BuilderState {
  elements: FloorElement[]
  selectedId: string | null
  snapToGrid: boolean
  gridSize: number
  scale: number
  stagePos: { x: number; y: number }
  past: FloorElement[][]
  future: FloorElement[][]
  saveStatus: SaveStatus
  currentFloorId: string | null
  floors: Floor[]

  setElements: (elements: FloorElement[]) => void
  addElement: (element: FloorElement) => void
  updateElement: (id: string, updates: Partial<FloorElement>) => void
  deleteElement: (id: string) => void
  selectElement: (id: string | null) => void
  toggleSnap: () => void
  setScale: (scale: number) => void
  setStagePos: (pos: { x: number; y: number }) => void
  undo: () => void
  redo: () => void
  setSaveStatus: (status: SaveStatus) => void
  setCurrentFloor: (floorId: string) => void
  setFloors: (floors: Floor[]) => void
  pushHistory: () => void
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  elements: [],
  selectedId: null,
  snapToGrid: true,
  gridSize: 20,
  scale: 1,
  stagePos: { x: 0, y: 0 },
  past: [],
  future: [],
  saveStatus: 'idle',
  currentFloorId: null,
  floors: [],

  pushHistory: () => {
    const { elements, past } = get()
    const snapshot = elements.map((el) => ({ ...el }))
    const newPast = [...past, snapshot].slice(-MAX_HISTORY)
    set({ past: newPast, future: [] })
  },

  setElements: (elements) => set({ elements }),

  addElement: (element) => {
    get().pushHistory()
    set((state) => ({ elements: [...state.elements, element] }))
  },

  updateElement: (id, updates) => {
    get().pushHistory()
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }))
  },

  deleteElement: (id) => {
    get().pushHistory()
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }))
  },

  selectElement: (id) => set({ selectedId: id }),

  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setScale: (scale) => set({ scale }),

  setStagePos: (stagePos) => set({ stagePos }),

  undo: () => {
    const { past, elements, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)
    set({
      elements: previous,
      past: newPast,
      future: [elements.map((el) => ({ ...el })), ...future].slice(0, MAX_HISTORY),
      selectedId: null,
    })
  },

  redo: () => {
    const { past, elements, future } = get()
    if (future.length === 0) return
    const next = future[0]
    const newFuture = future.slice(1)
    set({
      elements: next,
      past: [...past, elements.map((el) => ({ ...el }))].slice(-MAX_HISTORY),
      future: newFuture,
      selectedId: null,
    })
  },

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  setCurrentFloor: (floorId) => set({ currentFloorId: floorId }),

  setFloors: (floors) => set({ floors }),
}))
