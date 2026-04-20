// ─────────────────────────────────────────────────────────────────────────────
// Floor Plan — Types & Data Model
//
// The floor plan is stored as a JSON config so restaurants can update their
// layout without a code change. The renderer reads this config and draws
// tables, zones, walls, and decorative elements on a canvas.
//
// Coordinate system:
//   - All x, y, width, height values are in logical units (0–1000)
//   - The renderer scales them to the device screen size at paint time
//   - This makes the layout resolution-independent across all devices
//
// Usage:
//   import { TRATTORIA_ROMA } from './floorPlans/trattoriaRoma'
//   <FloorPlanMap config={TRATTORIA_ROMA} selectedDate="2025-05-24" partySize={2} />
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────────────────

export type TableShape = 'rectangle' | 'round' | 'square';

export type TableStatus =
  | 'available' // can be selected
  | 'taken' // already booked for this slot
  | 'selected' // user has tapped this table
  | 'ai_pick' // AI recommended this table
  | 'yours' // user already has a booking here (shown on My Bookings map)
  | 'blocked'; // blocked by restaurant (e.g. private event)

export type ZoneType = 'window' | 'main_floor' | 'bar_side' | 'outdoor' | 'private_dining' | 'mezzanine';

// ── Core entities ──────────────────────────────────────────────────────────────

export interface FloorZone {
  id: string;
  label: string;
  type: ZoneType;
  /** Top-left corner in logical units */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional: outdoor zones can be visually separated with a dashed border */
  isOutdoor?: boolean;
}

export interface TableConfig {
  id: string;
  /** Display label shown on the table e.g. "T1", "12" */
  label: string;
  shape: TableShape;
  /** Top-left corner in logical units */
  x: number;
  y: number;
  /** For rectangle/square tables */
  width: number;
  height: number;
  /** Minimum number of guests this table seats */
  minCapacity: number;
  /** Maximum number of guests this table seats */
  maxCapacity: number;
  /** Which zone this table belongs to */
  zoneId: string;
  /** Human readable description shown in the bottom sheet */
  description: string;
  /** Vibe tags shown as pills in the bottom sheet */
  tags: string[];
  /** Compass orientation — helps describe the table's position */
  position?: 'window' | 'corner' | 'centre' | 'bar' | 'outdoor' | 'booth';
  /** Rotation in degrees — for angled tables (rare) */
  rotation?: number;
}

export interface WallSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 'solid' for exterior walls, 'partition' for internal dividers */
  type: 'solid' | 'partition' | 'entrance';
}

export interface DecorativeElement {
  id: string;
  type: 'bar_counter' | 'kitchen' | 'reception' | 'plant' | 'stairs' | 'toilet';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface EntranceMarker {
  /** Which wall the entrance is on */
  side: 'top' | 'bottom' | 'left' | 'right';
  /** Position along the wall, 0–1 (0 = start, 1 = end) */
  offset: number;
  /** Width of the entrance opening in logical units */
  width: number;
  label?: string;
}

// ── Availability (comes from API, not stored in config) ───────────────────────

export interface TableAvailability {
  tableId: string;
  status: Exclude<TableStatus, 'selected' | 'ai_pick'>;
  /** ISO timestamp of the slot being checked */
  slotTime: string;
}

// ── AI recommendation (comes from AI service) ─────────────────────────────────

export interface AiTableRecommendation {
  tableId: string;
  reason: string;
  /** Confidence score 0–1 */
  confidence: number;
}

// ── Master floor plan config ───────────────────────────────────────────────────

export interface FloorPlanConfig {
  /** Unique identifier for this floor plan */
  id: string;
  restaurantId: string;
  /** Floor name e.g. "Ground floor", "Rooftop terrace" */
  name: string;
  /** Logical canvas dimensions — all coordinates are relative to these */
  canvasWidth: number;
  canvasHeight: number;
  zones: FloorZone[];
  tables: TableConfig[];
  walls: WallSegment[];
  decorativeElements: DecorativeElement[];
  entrances: EntranceMarker[];
  /** Last updated timestamp — used to invalidate client cache */
  updatedAt: string;
}

// ── Runtime state (managed by the FloorPlanMap component) ─────────────────────

export interface FloorPlanState {
  selectedTableId: string | null;
  availability: Record<string, TableAvailability>;
  aiRecommendation: AiTableRecommendation | null;
  partySize: number;
  /** Tables that are too small for the current party size */
  incompatibleTableIds: string[];
}

// ── Helper: derive runtime status for a table ─────────────────────────────────

export function getTableStatus(table: TableConfig, state: FloorPlanState): TableStatus {
  if (state.selectedTableId === table.id) return 'selected';

  const availability = state.availability[table.id];
  if (availability?.status === 'taken') return 'taken';
  if (availability?.status === 'blocked') return 'blocked';
  if (availability?.status === 'yours') return 'yours';

  if (state.aiRecommendation?.tableId === table.id) return 'ai_pick';

  return 'available';
}

// ── Helper: filter tables compatible with party size ──────────────────────────

export function getCompatibleTables(tables: TableConfig[], partySize: number): string[] {
  return tables.filter((t) => t.maxCapacity >= partySize).map((t) => t.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Example floor plan config — Trattoria Roma
// ─────────────────────────────────────────────────────────────────────────────

export const TRATTORIA_ROMA_FLOOR_PLAN: FloorPlanConfig = {
  id: 'trattoria-roma-ground',
  restaurantId: 'trattoria-roma',
  name: 'Ground floor',
  canvasWidth: 1000,
  canvasHeight: 1200,

  zones: [
    {
      id: 'zone-window',
      label: 'Window',
      type: 'window',
      x: 0,
      y: 0,
      width: 200,
      height: 600,
    },
    {
      id: 'zone-main',
      label: 'Main floor',
      type: 'main_floor',
      x: 200,
      y: 0,
      width: 600,
      height: 800,
    },
    {
      id: 'zone-bar',
      label: 'Bar side',
      type: 'bar_side',
      x: 800,
      y: 0,
      width: 200,
      height: 600,
    },
    {
      id: 'zone-outdoor',
      label: 'Outdoor terrace',
      type: 'outdoor',
      x: 0,
      y: 850,
      width: 1000,
      height: 350,
      isOutdoor: true,
    },
  ],

  tables: [
    {
      id: 't1',
      label: 'T1',
      shape: 'rectangle',
      x: 40,
      y: 80,
      width: 160,
      height: 110,
      minCapacity: 2,
      maxCapacity: 2,
      zoneId: 'zone-window',
      description: 'Window seat with street view',
      tags: ['Romantic', 'Quiet', 'Natural light'],
      position: 'window',
    },
    {
      id: 't2',
      label: 'T2',
      shape: 'rectangle',
      x: 40,
      y: 260,
      width: 160,
      height: 110,
      minCapacity: 2,
      maxCapacity: 2,
      zoneId: 'zone-window',
      description: 'Window seat, great for people watching',
      tags: ['Lively', 'Street view'],
      position: 'window',
    },
    {
      id: 't3',
      label: 'T3',
      shape: 'rectangle',
      x: 40,
      y: 440,
      width: 160,
      height: 110,
      minCapacity: 2,
      maxCapacity: 2,
      zoneId: 'zone-window',
      description: 'Corner window seat',
      tags: ['Cosy', 'Corner'],
      position: 'corner',
    },
    {
      id: 't4',
      label: 'T4',
      shape: 'rectangle',
      x: 280,
      y: 80,
      width: 200,
      height: 130,
      minCapacity: 2,
      maxCapacity: 4,
      zoneId: 'zone-main',
      description: 'Centre floor table, great for groups',
      tags: ['Family', 'Spacious'],
      position: 'centre',
    },
    {
      id: 't5',
      label: 'T5',
      shape: 'rectangle',
      x: 280,
      y: 300,
      width: 200,
      height: 130,
      minCapacity: 2,
      maxCapacity: 4,
      zoneId: 'zone-main',
      description: 'Centre floor, lively atmosphere',
      tags: ['Lively', 'Centre'],
      position: 'centre',
    },
    {
      id: 't6',
      label: 'T6',
      shape: 'rectangle',
      x: 520,
      y: 80,
      width: 160,
      height: 110,
      minCapacity: 2,
      maxCapacity: 2,
      zoneId: 'zone-main',
      description: 'Intimate booth near the main floor',
      tags: ['Cosy', 'Private', 'Booth'],
      position: 'booth',
    },
    {
      id: 't7',
      label: 'T7',
      shape: 'rectangle',
      x: 280,
      y: 540,
      width: 280,
      height: 130,
      minCapacity: 4,
      maxCapacity: 8,
      zoneId: 'zone-main',
      description: 'Large group table, ideal for celebrations',
      tags: ['Group dining', 'Spacious', 'Celebrations'],
      position: 'centre',
    },
    {
      id: 't8',
      label: 'T8',
      shape: 'round',
      x: 840,
      y: 300,
      width: 130,
      height: 130,
      minCapacity: 2,
      maxCapacity: 2,
      zoneId: 'zone-bar',
      description: 'Intimate round table near the bar',
      tags: ['Lively', 'Near bar'],
      position: 'bar',
    },
    {
      id: 't9',
      label: 'T9',
      shape: 'round',
      x: 840,
      y: 480,
      width: 130,
      height: 130,
      minCapacity: 2,
      maxCapacity: 2,
      zoneId: 'zone-bar',
      description: 'Round table by the bar, great for drinks',
      tags: ['Lively', 'Near bar'],
      position: 'bar',
    },
    {
      id: 't10',
      label: 'T10',
      shape: 'rectangle',
      x: 100,
      y: 920,
      width: 200,
      height: 130,
      minCapacity: 2,
      maxCapacity: 4,
      zoneId: 'zone-outdoor',
      description: 'Outdoor terrace, open air dining',
      tags: ['Outdoor', 'Breezy', 'Romantic'],
      position: 'outdoor',
    },
    {
      id: 't11',
      label: 'T11',
      shape: 'rectangle',
      x: 380,
      y: 920,
      width: 200,
      height: 130,
      minCapacity: 2,
      maxCapacity: 4,
      zoneId: 'zone-outdoor',
      description: 'Outdoor terrace, garden views',
      tags: ['Outdoor', 'Garden view'],
      position: 'outdoor',
    },
    {
      id: 't12',
      label: 'T12',
      shape: 'rectangle',
      x: 660,
      y: 920,
      width: 200,
      height: 130,
      minCapacity: 4,
      maxCapacity: 6,
      zoneId: 'zone-outdoor',
      description: 'Large outdoor table for groups',
      tags: ['Outdoor', 'Group', 'Garden view'],
      position: 'outdoor',
    },
  ],

  walls: [
    // Exterior walls
    { x: 0, y: 0, width: 1000, height: 12, type: 'solid' },
    { x: 0, y: 988, width: 1000, height: 12, type: 'solid' },
    { x: 0, y: 0, width: 12, height: 1000, type: 'solid' },
    { x: 988, y: 0, width: 12, height: 1000, type: 'solid' },
    // Internal partition between main floor and bar
    { x: 800, y: 0, width: 8, height: 400, type: 'partition' },
  ],

  decorativeElements: [
    {
      id: 'bar',
      type: 'bar_counter',
      x: 820,
      y: 20,
      width: 160,
      height: 240,
      label: 'Bar',
    },
    {
      id: 'kitchen',
      type: 'kitchen',
      x: 700,
      y: 600,
      width: 280,
      height: 200,
      label: 'Kitchen',
    },
  ],

  entrances: [
    {
      side: 'bottom',
      offset: 0.5,
      width: 120,
      label: 'Main entrance',
    },
  ],

  updatedAt: '2025-05-01T00:00:00Z',
};
