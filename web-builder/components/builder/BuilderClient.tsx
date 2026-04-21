'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useBuilderStore } from '@/lib/store/builderStore'
import { createClient } from '@/lib/supabase/client'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import Canvas from './Canvas'
import PropertiesPanel from './PropertiesPanel'
import type { Floor, Restaurant } from '@/types/floorplan'

interface Props {
  restaurant: Restaurant
  initialFloors: Floor[]
  isAdmin: boolean
}

export default function BuilderClient({ restaurant, initialFloors, isAdmin }: Props) {
  const supabase = createClient()
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    elements,
    currentFloorId,
    floors,
    saveStatus,
    setFloors,
    setCurrentFloor,
    setElements,
    setSaveStatus,
    selectedId,
  } = useBuilderStore()

  useEffect(() => {
    if (initialFloors.length > 0) {
      setFloors(initialFloors)
      setCurrentFloor(initialFloors[0].id)
      setElements(initialFloors[0].elements ?? [])
    }
  }, [])

  const saveFloor = useCallback(async (floorId: string, els: typeof elements) => {
    setSaveStatus('saving')
    const { error } = await supabase
      .from('floors')
      .update({ elements: els })
      .eq('id', floorId)

    setSaveStatus(error ? 'error' : 'saved')

    if (!error) {
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }, [supabase, setSaveStatus])

  useEffect(() => {
    if (!currentFloorId) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      saveFloor(currentFloorId, elements)
    }, 600)
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [elements, currentFloorId])

  const handleFloorChange = useCallback((floorId: string) => {
    const floor = floors.find((f) => f.id === floorId)
    if (!floor) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    setCurrentFloor(floorId)
    setElements(floor.elements ?? [])
  }, [floors, setCurrentFloor, setElements])

  const handleAddFloor = useCallback(async () => {
    const name = `Floor ${floors.length + 1}`
    const { data, error } = await supabase
      .from('floors')
      .insert({ restaurant_id: restaurant.id, name, order: floors.length, elements: [] })
      .select()
      .single()

    if (error || !data) return

    const newFloor: Floor = { ...data, elements: [] }
    const updated = [...floors, newFloor]
    setFloors(updated)
    setCurrentFloor(newFloor.id)
    setElements([])
  }, [floors, restaurant.id, supabase, setFloors, setCurrentFloor, setElements])

  const handleDeleteFloor = useCallback(async () => {
    if (!currentFloorId || floors.length <= 1) return
    if (!confirm('Delete this floor and all its elements?')) return

    const { error } = await supabase.from('floors').delete().eq('id', currentFloorId)
    if (error) return

    const updated = floors.filter((f) => f.id !== currentFloorId)
    setFloors(updated)
    setCurrentFloor(updated[0].id)
    setElements(updated[0].elements ?? [])
  }, [currentFloorId, floors, supabase, setFloors, setCurrentFloor, setElements])

  const handleSave = useCallback(() => {
    if (!currentFloorId) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    saveFloor(currentFloorId, elements)
  }, [currentFloorId, elements, saveFloor])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Toolbar
        restaurantName={restaurant.name}
        floors={floors}
        currentFloorId={currentFloorId}
        saveStatus={saveStatus}
        isAdmin={isAdmin}
        onFloorChange={handleFloorChange}
        onAddFloor={handleAddFloor}
        onDeleteFloor={handleDeleteFloor}
        onSave={handleSave}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />

        <Canvas />

        {selectedId && <PropertiesPanel />}
      </div>
    </div>
  )
}
