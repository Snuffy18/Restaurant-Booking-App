export type ElementType =
  | 'table-round'
  | 'table-rect'
  | 'table-square'
  | 'wall'
  | 'zone'
  | 'bar'
  | 'plant'
  | 'couch'

export interface FloorElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  label?: string
  capacity?: number
  zone?: string
  tags?: string[]
  color?: string
}

export interface Floor {
  id: string
  restaurant_id: string
  name: string
  order: number
  elements: FloorElement[]
}

export interface Restaurant {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
