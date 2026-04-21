import type {
  FloorPlanConfig,
  FloorZone,
  TableConfig,
  WallSegment,
  DecorativeElement,
  ZoneType,
  TableShape,
} from './floorPlanTypes'

// ── Types matching the web builder's storage schema ───────────────────────────

type BuilderElementType =
  | 'table-round'
  | 'table-rect'
  | 'table-square'
  | 'wall'
  | 'zone'
  | 'bar'
  | 'plant'
  | 'couch'

export interface BuilderElement {
  id: string
  type: BuilderElementType
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

// ── Zone string → ZoneType mapping ────────────────────────────────────────────

function toZoneType(zone?: string): ZoneType {
  const lower = (zone ?? '').toLowerCase()
  if (lower.includes('outdoor') || lower.includes('terrace')) return 'outdoor'
  if (lower.includes('bar')) return 'bar_side'
  if (lower.includes('vip') || lower.includes('private')) return 'private_dining'
  if (lower.includes('window')) return 'window'
  if (lower.includes('mezzanine')) return 'mezzanine'
  return 'main_floor'
}

function toTableShape(type: BuilderElementType): TableShape {
  if (type === 'table-round') return 'round'
  if (type === 'table-square') return 'square'
  return 'rectangle'
}

// ── Main converter ─────────────────────────────────────────────────────────────

export function builderElementsToFloorPlanConfig(
  elements: BuilderElement[],
  restaurantId: string,
  floorId: string,
  floorName: string,
): FloorPlanConfig {
  const CANVAS_W = 1000
  const CANVAS_H = 1200
  const PADDING = 40

  // Compute bounding box so we can normalise coordinates to 0–1000
  const maxX = elements.reduce((m, el) => Math.max(m, el.x + el.width), CANVAS_W / 2)
  const maxY = elements.reduce((m, el) => Math.max(m, el.y + el.height), CANVAS_H / 2)

  const scaleX = CANVAS_W / (maxX + PADDING)
  const scaleY = CANVAS_H / (maxY + PADDING)

  const sx = (v: number) => Math.round(v * scaleX)
  const sy = (v: number) => Math.round(v * scaleY)

  const zones: FloorZone[] = elements
    .filter((el) => el.type === 'zone')
    .map((el) => ({
      id: el.id,
      label: el.label || 'Zone',
      type: toZoneType(el.zone ?? el.label),
      x: sx(el.x),
      y: sy(el.y),
      width: sx(el.width),
      height: sy(el.height),
      isOutdoor: toZoneType(el.zone ?? el.label) === 'outdoor',
    }))

  const tables: TableConfig[] = elements
    .filter((el) => el.type.startsWith('table'))
    .map((el) => {
      const cap = el.capacity ?? 2
      return {
        id: el.id,
        label: el.label || el.id,
        shape: toTableShape(el.type),
        x: sx(el.x),
        y: sy(el.y),
        width: sx(el.width),
        height: sy(el.height),
        minCapacity: Math.max(1, Math.floor(cap / 2)),
        maxCapacity: cap,
        zoneId: zones.find((z) =>
          el.x >= el.x && el.y >= el.y
        )?.id ?? '',
        description: el.label ? `Table ${el.label}` : 'Table',
        tags: el.tags ?? [],
        rotation: el.rotation || undefined,
      }
    })

  const walls: WallSegment[] = elements
    .filter((el) => el.type === 'wall')
    .map((el) => ({
      x: sx(el.x),
      y: sy(el.y),
      width: sx(el.width),
      height: sy(el.height),
      type: 'solid' as const,
    }))

  const decorativeElements: DecorativeElement[] = elements
    .filter((el) => ['bar', 'plant', 'couch'].includes(el.type))
    .map((el) => ({
      id: el.id,
      type: (el.type === 'bar'
        ? 'bar_counter'
        : el.type === 'plant'
        ? 'plant'
        : 'reception') as DecorativeElement['type'],
      x: sx(el.x),
      y: sy(el.y),
      width: sx(el.width),
      height: sy(el.height),
      label: el.label,
    }))

  return {
    id: floorId,
    restaurantId,
    name: floorName,
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
    zones,
    tables,
    walls,
    decorativeElements,
    entrances: [],
    updatedAt: new Date().toISOString(),
  }
}
