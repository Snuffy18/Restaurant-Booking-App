import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { builderElementsToFloorPlanConfig, type BuilderElement } from '@/components/floorplan/floorPlanAdapter'
import type { FloorPlanConfig } from '@/components/floorplan/floorPlanTypes'

interface UseFloorPlanResult {
  config: FloorPlanConfig | null
  loading: boolean
  error: string | null
}

export function useFloorPlan(restaurantId: string | undefined): UseFloorPlanResult {
  const [config, setConfig] = useState<FloorPlanConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchFloor() {
      const { data, error: dbError } = await supabase
        .from('floors')
        .select('id, name, elements')
        .eq('restaurant_id', restaurantId)
        .order('order', { ascending: true })
        .limit(1)
        .single()

      if (cancelled) return

      if (dbError || !data) {
        setError(dbError?.message ?? 'Floor plan not found')
        setConfig(null)
        setLoading(false)
        return
      }

      const elements = (data.elements ?? []) as BuilderElement[]

      if (elements.length === 0) {
        setConfig(null)
        setLoading(false)
        return
      }

      const floorConfig = builderElementsToFloorPlanConfig(
        elements,
        restaurantId,
        data.id,
        data.name,
      )

      setConfig(floorConfig)
      setLoading(false)
    }

    setLoading(true)
    setError(null)
    fetchFloor()

    const channel = supabase
      .channel(`floor:${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'floors',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const elements = ((payload.new as { elements?: BuilderElement[] }).elements ?? []) as BuilderElement[]
          if (elements.length === 0) {
            setConfig(null)
            return
          }
          const floorId = (payload.new as { id: string }).id
          const floorName = (payload.new as { name: string }).name
          setConfig(builderElementsToFloorPlanConfig(elements, restaurantId, floorId, floorName))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  return { config, loading, error }
}
