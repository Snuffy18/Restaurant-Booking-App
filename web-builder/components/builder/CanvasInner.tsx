'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Group, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useBuilderStore } from '@/lib/store/builderStore'
import type { FloorElement, ElementType, Guide } from '@/types/floorplan'

// ── Constants ──────────────────────────────────────────────────────────────────
const ZOOM_MIN = 0.1
const ZOOM_MAX = 5
const ZOOM_FACTOR = 1.1
const RULER_W = 20        // ruler thickness px
const GUIDE_EXTENT = 30000 // how far guide lines extend in canvas units
const MINIMAP_W = 160
const MINIMAP_H = 100
const LOGICAL_W = 2000    // minimap logical canvas extent
const LOGICAL_H = 1250

// ── Helpers ────────────────────────────────────────────────────────────────────
function snap(v: number, g: number, on: boolean) { return on ? Math.round(v / g) * g : v }

function getDefaultColor(type: ElementType): string {
  switch (type) {
    case 'table-round': case 'table-rect': case 'table-square': return '#fef3c7'
    case 'wall': return '#374151'
    case 'zone': return '#93c5fd'
    case 'bar': return '#c4b5fd'
    case 'plant': return '#6ee7b7'
    case 'couch': return '#fcd34d'
    default: return '#e5e7eb'
  }
}

function getDefaultLabel(type: ElementType): string {
  switch (type) {
    case 'table-round': case 'table-rect': case 'table-square': return 'T1'
    case 'zone': return 'Zone'
    case 'bar': return 'Bar'
    default: return ''
  }
}

const DEFAULT_SIZES: Record<ElementType, { width: number; height: number }> = {
  'table-round': { width: 60, height: 60 }, 'table-rect': { width: 80, height: 60 },
  'table-square': { width: 60, height: 60 }, 'wall': { width: 120, height: 12 },
  'zone': { width: 160, height: 120 }, 'bar': { width: 120, height: 40 },
  'plant': { width: 30, height: 30 }, 'couch': { width: 100, height: 40 },
}

// ── Chair previews ─────────────────────────────────────────────────────────────
function ChairsForElement({ el }: { el: FloorElement }) {
  const cap = el.capacity ?? 0
  if (!cap || !el.type.startsWith('table')) return null
  const fill = '#a8a29e', stroke = '#78716c', n = Math.min(cap, 12)
  return (
    <Group x={el.x} y={el.y} rotation={el.rotation ?? 0} listening={false}>
      {el.type === 'table-round'
        ? Array.from({ length: n }, (_, i) => {
            const a = ((270 + 360 / n * i) * Math.PI) / 180
            return <Circle key={i} x={el.width/2 + (el.width/2+10)*Math.cos(a)} y={el.height/2 + (el.height/2+10)*Math.sin(a)} radius={5} fill={fill} stroke={stroke} strokeWidth={0.5} />
          })
        : <>
            {Array.from({ length: Math.min(Math.ceil(n/2), 8) }, (_, i) => {
              const t = Math.ceil(n/2)
              return <Rect key={`t${i}`} x={((i+1)/(t+1))*el.width-4.5} y={-9} width={9} height={6} fill={fill} stroke={stroke} strokeWidth={0.5} cornerRadius={2} />
            })}
            {Array.from({ length: Math.min(Math.floor(n/2), 8) }, (_, i) => {
              const b = Math.floor(n/2)
              return <Rect key={`b${i}`} x={((i+1)/(b+1))*el.width-4.5} y={el.height+3} width={9} height={6} fill={fill} stroke={stroke} strokeWidth={0.5} cornerRadius={2} />
            })}
          </>
      }
    </Group>
  )
}

// ── Guide line ─────────────────────────────────────────────────────────────────
function GuideLine({ guide, snapToGrid, gridSize, onUpdate, onDelete }: {
  guide: Guide; snapToGrid: boolean; gridSize: number
  onUpdate: (id: string, pos: number) => void; onDelete: (id: string) => void
}) {
  const isH = guide.axis === 'h'
  return (
    <Group
      x={isH ? 0 : guide.position} y={isH ? guide.position : 0}
      draggable
      dragBoundFunc={(pos) => isH ? { x: 0, y: pos.y } : { x: pos.x, y: 0 }}
      onDragEnd={(e) => {
        const raw = isH ? e.target.y() : e.target.x()
        const snapped = snap(raw, gridSize, snapToGrid)
        e.target.position(isH ? { x: 0, y: snapped } : { x: snapped, y: 0 })
        if (snapped < -20) onDelete(guide.id); else onUpdate(guide.id, snapped)
      }}
      onDblClick={() => onDelete(guide.id)}
      onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = isH ? 'row-resize' : 'col-resize' }}
      onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'default' }}
    >
      <Line
        points={isH ? [-GUIDE_EXTENT, 0, GUIDE_EXTENT, 0] : [0, -GUIDE_EXTENT, 0, GUIDE_EXTENT]}
        stroke="#3b82f6" strokeWidth={1} opacity={0.6} dash={[8, 4]} hitStrokeWidth={10}
      />
    </Group>
  )
}

// ── ElementShape ───────────────────────────────────────────────────────────────
interface ElementShapeProps {
  element: FloorElement; isSelected: boolean
  onSelect: (id: string, shiftKey: boolean) => void
  onDragStart: (el: FloorElement) => void
  onDragMove: (id: string, x: number, y: number) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, updates: Partial<FloorElement>) => void
}

function ElementShape({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd }: ElementShapeProps) {
  const shapeRef = useRef<Konva.Group>(null)

  const handleTransformEnd = () => {
    if (!shapeRef.current) return
    const node = shapeRef.current
    const sx = node.scaleX(), sy = node.scaleY()
    node.scaleX(1); node.scaleY(1)
    onTransformEnd(element.id, { x: node.x(), y: node.y(), width: Math.max(20, element.width * sx), height: Math.max(20, element.height * sy), rotation: node.rotation() })
  }

  const locked = !!element.locked
  const strokeColor = locked ? '#f59e0b' : isSelected ? '#3b82f6' : '#9ca3af'
  const strokeWidth = isSelected ? 2 : 1
  const fill = element.color || getDefaultColor(element.type)
  const labelProps = { fontSize: 11, fill: element.type === 'wall' ? '#fff' : '#374151', fontFamily: '-apple-system,sans-serif', align: 'center' as const }

  return (
    <Group
      id={element.id} ref={shapeRef} x={element.x} y={element.y} rotation={element.rotation}
      opacity={locked ? 0.72 : 1}
      draggable={!locked}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={() => onSelect(element.id, false)}
      onDragStart={() => onDragStart(element)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      onTransformEnd={handleTransformEnd}
    >
      {element.type === 'table-round' ? (
        <>
          <Circle x={element.width/2} y={element.height/2} radius={element.width/2} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} />
          {element.label && <Text x={0} y={element.height/2-6} width={element.width} text={element.label} {...labelProps} />}
        </>
      ) : element.type === 'zone' ? (
        <>
          <Rect width={element.width} height={element.height} fill={fill} opacity={0.25} stroke={strokeColor} strokeWidth={strokeWidth} dash={[6,3]} cornerRadius={6} />
          {element.label && <Text x={4} y={element.height/2-6} width={element.width-8} text={element.label} {...labelProps} fill="#1d4ed8" />}
        </>
      ) : (
        <>
          <Rect width={element.width} height={element.height} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} cornerRadius={element.type==='plant' ? element.width/2 : 3} />
          {element.label && <Text x={4} y={element.height/2-6} width={element.width-8} text={element.label} {...labelProps} />}
        </>
      )}
      {/* Lock badge */}
      {locked && (
        <Circle
          x={element.type === 'table-round' ? element.width / 2 : element.width - 8}
          y={element.type === 'table-round' ? element.height / 2 : 8}
          radius={6} fill="#f59e0b" opacity={0.95} listening={false}
        />
      )}
    </Group>
  )
}

// ── CanvasInner ────────────────────────────────────────────────────────────────
type SelRect = { x: number; y: number; width: number; height: number }

export default function CanvasInner({ width, height }: { width: number; height: number }) {
  // Stage / interaction refs
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const isPanning = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })
  const isSpaceDown = useRef(false)
  const isAltDown = useRef(false)
  const prevScale = useRef(1)
  const multiDragAnchor = useRef<{ draggedId: string; startPos: Record<string, { x: number; y: number }> } | null>(null)
  const isSelecting = useRef(false)
  const selectionStart = useRef<{ x: number; y: number } | null>(null)
  const selectionRectRef = useRef<SelRect | null>(null)
  const [selectionRect, setSelectionRect] = useState<SelRect | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Overlay refs
  const hRulerRef = useRef<HTMLCanvasElement>(null)
  const vRulerRef = useRef<HTMLCanvasElement>(null)
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawRulersRef = useRef<() => void>(() => {})
  const drawMinimapRef = useRef<() => void>(() => {})

  // Store
  const {
    elements, selectedIds, guides, showGuides, snapToGrid, gridSize, scale, isDark,
    addElement, updateElement, updateElements, selectElement, selectElements, setScale,
    addGuide, updateGuide, deleteGuide, copy, paste,
  } = useBuilderStore()

  // ── Sync stage scale from slider ──────────────────────────────────────────
  useEffect(() => {
    if (prevScale.current === scale) return
    prevScale.current = scale
    const stage = stageRef.current
    if (!stage || Math.abs(stage.scaleX() - scale) < 0.001) return
    const old = stage.scaleX(), cx = width / 2, cy = height / 2
    stage.scale({ x: scale, y: scale })
    stage.position({ x: cx - (cx - stage.x()) * (scale / old), y: cy - (cy - stage.y()) * (scale / old) })
    drawRulersRef.current(); drawMinimapRef.current()
  }, [scale, width, height])

  // ── Transformer attachment ─────────────────────────────────────────────────
  const selectedIdsKey = selectedIds.join(',')
  useEffect(() => {
    const tr = trRef.current, stage = stageRef.current
    if (!tr || !stage) return
    const nodes = selectedIds.flatMap(id => {
      const el = useBuilderStore.getState().elements.find(e => e.id === id)
      if (el?.locked) return []
      const node = stage.findOne(`#${id}`)
      return node ? [node as Konva.Node] : []
    })
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdsKey, elements])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') isAltDown.current = true
      if (e.code === 'Space' && !e.repeat) {
        isSpaceDown.current = true
        const c = stageRef.current?.container(); if (c) c.style.cursor = 'grab'
      }
      const active = document.activeElement
      const inInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA'

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault(); e.shiftKey ? useBuilderStore.getState().redo() : useBuilderStore.getState().undo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !inInput) {
        e.preventDefault(); useBuilderStore.getState().copy()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && !inInput) {
        e.preventDefault(); useBuilderStore.getState().paste()
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !inInput) {
        useBuilderStore.getState().deleteSelected()
      }
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key) && !inInput) {
        const { selectedIds: ids, elements: els, gridSize: gs } = useBuilderStore.getState()
        if (!ids.length) return
        e.preventDefault()
        const step = e.shiftKey ? gs : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        useBuilderStore.getState().updateElements(ids.flatMap(id => {
          const el = els.find(e => e.id === id)
          return el && !el.locked ? [{ id, updates: { x: el.x + dx, y: el.y + dy } }] : []
        }))
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') isAltDown.current = false
      if (e.code === 'Space') { isSpaceDown.current = false; const c = stageRef.current?.container(); if (c) c.style.cursor = 'default' }
    }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Draw rulers ───────────────────────────────────────────────────────────
  const drawRulers = useCallback(() => {
    const hC = hRulerRef.current, vC = vRulerRef.current, stage = stageRef.current
    if (!hC || !vC || !stage) return
    const sp = stage.position(), ss = stage.scaleX()
    const bg = isDark ? '#1f2937' : '#f8fafc'
    const tickClr = isDark ? '#374151' : '#e2e8f0'
    const txtClr = isDark ? '#6b7280' : '#94a3b8'
    const px = gridSize * ss
    const every = px < 15 ? 10 : px < 30 ? 5 : px < 60 ? 2 : 1
    const major = gridSize * every

    function axis(ctx: CanvasRenderingContext2D, W: number, H: number, isH: boolean) {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = tickClr; ctx.fillStyle = txtClr
      ctx.font = '8px ui-sans-serif,sans-serif'; ctx.lineWidth = 1
      const offset = isH ? sp.x : sp.y
      const size = isH ? W : H
      const first = Math.floor((RULER_W - offset) / ss / major) * major
      for (let u = first; ; u += major) {
        const screen = offset + u * ss - RULER_W
        if (screen > size) break
        if (screen < -1) continue
        ctx.beginPath()
        if (isH) { ctx.moveTo(screen, H - 7); ctx.lineTo(screen, H) }
        else { ctx.moveTo(W - 7, screen); ctx.lineTo(W, screen) }
        ctx.stroke()
        if (major * ss > 22) {
          if (isH) { ctx.textAlign = 'center'; ctx.fillText(String(u), screen, H - 9) }
          else { ctx.textAlign = 'right'; ctx.fillText(String(u), W - 9, screen + 3) }
        }
      }
      // Minor ticks
      if (px > 8) {
        const firstM = Math.floor((RULER_W - offset) / ss / gridSize) * gridSize
        for (let u = firstM; ; u += gridSize) {
          if (u % major === 0) continue
          const s = offset + u * ss - RULER_W
          if (s > size) break; if (s < -1) continue
          ctx.beginPath()
          if (isH) { ctx.moveTo(s, H - 3); ctx.lineTo(s, H) }
          else { ctx.moveTo(W - 3, s); ctx.lineTo(W, s) }
          ctx.stroke()
        }
      }
      ctx.strokeStyle = isDark ? '#374151' : '#e2e8f0'
      ctx.strokeRect(0, 0, W, H)
    }

    const hCtx = hC.getContext('2d'); if (hCtx) axis(hCtx, hC.width, RULER_W, true)
    const vCtx = vC.getContext('2d'); if (vCtx) axis(vCtx, RULER_W, vC.height, false)
  }, [gridSize, isDark])

  // ── Draw minimap ──────────────────────────────────────────────────────────
  const drawMinimap = useCallback(() => {
    const canvas = minimapCanvasRef.current, stage = stageRef.current
    if (!canvas || !stage) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sx = MINIMAP_W / LOGICAL_W, sy = MINIMAP_H / LOGICAL_H
    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)
    ctx.fillStyle = isDark ? '#111827' : '#f3f4f6'; ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)
    for (const el of elements) {
      const color = el.color || getDefaultColor(el.type)
      ctx.globalAlpha = 0.8; ctx.fillStyle = color
      ctx.strokeStyle = isDark ? '#4b5563' : '#9ca3af'; ctx.lineWidth = 0.4
      const mx = el.x * sx, my = el.y * sy
      const mw = Math.max(2, el.width * sx), mh = Math.max(2, el.height * sy)
      if (el.type === 'table-round') {
        ctx.beginPath(); ctx.ellipse(mx+mw/2, my+mh/2, mw/2, mh/2, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke()
      } else { ctx.fillRect(mx, my, mw, mh); ctx.strokeRect(mx, my, mw, mh) }
    }
    ctx.globalAlpha = 1
    // Viewport rect
    const sp = stage.position(), ss = stage.scaleX()
    const vx = (-sp.x/ss)*sx, vy = (-sp.y/ss)*sy, vw = (width/ss)*sx, vh = (height/ss)*sy
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.setLineDash([])
    ctx.strokeRect(Math.max(0,vx), Math.max(0,vy), Math.min(MINIMAP_W-Math.max(0,vx), vw), Math.min(MINIMAP_H-Math.max(0,vy), vh))
  }, [elements, isDark, width, height])

  // Keep overlay refs fresh
  drawRulersRef.current = drawRulers
  drawMinimapRef.current = drawMinimap

  // Redraw overlays when deps change
  useEffect(() => { drawRulersRef.current(); drawMinimapRef.current() }, [elements, isDark, scale])

  // Resize ruler canvases when container resizes
  useEffect(() => {
    const hC = hRulerRef.current, vC = vRulerRef.current
    if (hC) { hC.width = Math.max(1, width - RULER_W); hC.height = RULER_W }
    if (vC) { vC.width = RULER_W; vC.height = Math.max(1, height - RULER_W) }
    drawRulersRef.current()
  }, [width, height])

  // ── Wheel (zoom) ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current; if (!stage) return
    const old = stage.scaleX(), ptr = stage.getPointerPosition(); if (!ptr) return
    const mp = { x: (ptr.x - stage.x()) / old, y: (ptr.y - stage.y()) / old }
    const dir = e.evt.deltaY < 0 ? 1 : -1
    const ns = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, old * (dir > 0 ? ZOOM_FACTOR : 1/ZOOM_FACTOR)))
    stage.scale({ x: ns, y: ns })
    stage.position({ x: ptr.x - mp.x * ns, y: ptr.y - mp.y * ns })
    prevScale.current = ns; setScale(ns)
    drawRulersRef.current(); drawMinimapRef.current()
  }, [setScale])

  // ── Mouse down ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || isSpaceDown.current) {
      isPanning.current = true; lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      const c = stageRef.current?.container(); if (c) c.style.cursor = 'grabbing'
      e.evt.preventDefault(); return
    }
    if (e.target === e.target.getStage()) {
      const stage = stageRef.current, pos = stage?.getRelativePointerPosition()
      if (pos) {
        isSelecting.current = true; selectionStart.current = pos
        const r = { x: pos.x, y: pos.y, width: 0, height: 0 }
        selectionRectRef.current = r; setSelectionRect(r)
      }
    }
  }, [])

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      const stage = stageRef.current; if (!stage) return
      const dx = e.evt.clientX - lastPanPos.current.x, dy = e.evt.clientY - lastPanPos.current.y
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      stage.position({ x: stage.x() + dx, y: stage.y() + dy })
      drawRulersRef.current(); drawMinimapRef.current()
      return
    }
    if (isSelecting.current && selectionStart.current) {
      const pos = stageRef.current?.getRelativePointerPosition(); if (!pos) return
      const s = selectionStart.current
      const r: SelRect = { x: Math.min(s.x,pos.x), y: Math.min(s.y,pos.y), width: Math.abs(pos.x-s.x), height: Math.abs(pos.y-s.y) }
      selectionRectRef.current = r; setSelectionRect(r)
    }
  }, [])

  // ── Mouse up ──────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      isPanning.current = false
      const c = stageRef.current?.container(); if (c) c.style.cursor = isSpaceDown.current ? 'grab' : 'default'
    }
    if (isSelecting.current) {
      isSelecting.current = false
      const rect = selectionRectRef.current
      if (rect && (rect.width > 5 || rect.height > 5)) {
        const found = useBuilderStore.getState().elements
          .filter(el => !(el.x+el.width < rect.x || el.x > rect.x+rect.width || el.y+el.height < rect.y || el.y > rect.y+rect.height))
          .map(el => el.id)
        if (e.evt.shiftKey) selectElements(Array.from(new Set([...useBuilderStore.getState().selectedIds, ...found])))
        else selectElements(found)
      } else if (!e.evt.shiftKey) selectElement(null)
      selectionRectRef.current = null; setSelectionRect(null)
    }
  }, [selectElement, selectElements])

  // ── Drag over / drop ──────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragOver(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const stage = stageRef.current; if (!stage) return
    const type = e.dataTransfer.getData('elementType') as ElementType; if (!type) return
    stage.setPointersPositions(e.nativeEvent as unknown as Event)
    const pos = stage.getRelativePointerPosition(); if (!pos) return
    const size = DEFAULT_SIZES[type] ?? { width: 60, height: 60 }
    addElement({ id: crypto.randomUUID(), type, x: snap(pos.x-size.width/2, gridSize, snapToGrid), y: snap(pos.y-size.height/2, gridSize, snapToGrid), ...size, rotation: 0, label: getDefaultLabel(type), capacity: type.startsWith('table') ? 2 : undefined })
  }, [addElement, gridSize, snapToGrid])

  // ── Element drag ──────────────────────────────────────────────────────────
  const handleElementDragStart = useCallback((element: FloorElement) => {
    if (isAltDown.current) addElement({ ...element, id: crypto.randomUUID() })
    const { selectedIds: ids, elements: els } = useBuilderStore.getState()
    if (ids.includes(element.id) && ids.length > 1) {
      const startPos: Record<string, { x: number; y: number }> = {}
      for (const id of ids) { const el = els.find(e => e.id === id); if (el) startPos[id] = { x: el.x, y: el.y } }
      multiDragAnchor.current = { draggedId: element.id, startPos }
    } else { multiDragAnchor.current = null }
  }, [addElement])

  const handleElementDragMove = useCallback((id: string, cx: number, cy: number) => {
    const anchor = multiDragAnchor.current; if (!anchor || anchor.draggedId !== id) return
    const dx = cx - anchor.startPos[id].x, dy = cy - anchor.startPos[id].y
    const stage = stageRef.current; if (!stage) return
    for (const oid of Object.keys(anchor.startPos)) {
      if (oid === id) continue
      const node = stage.findOne(`#${oid}`), s = anchor.startPos[oid]
      if (node && s) { node.x(s.x + dx); node.y(s.y + dy) }
    }
  }, [])

  const handleElementDragEnd = useCallback((id: string, rawX: number, rawY: number) => {
    const sx = snap(rawX, gridSize, snapToGrid), sy = snap(rawY, gridSize, snapToGrid)
    const anchor = multiDragAnchor.current
    if (anchor && anchor.draggedId === id) {
      const dx = sx - anchor.startPos[id].x, dy = sy - anchor.startPos[id].y
      updateElements(Object.entries(anchor.startPos).map(([eid, s]) => ({
        id: eid, updates: { x: eid===id ? sx : snap(s.x+dx, gridSize, snapToGrid), y: eid===id ? sy : snap(s.y+dy, gridSize, snapToGrid) }
      })))
      multiDragAnchor.current = null
    } else { updateElement(id, { x: sx, y: sy }) }
  }, [gridSize, snapToGrid, updateElement, updateElements])

  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    const { selectedIds: ids } = useBuilderStore.getState()
    if (shiftKey) selectElements(ids.includes(id) ? ids.filter(s => s !== id) : [...ids, id])
    else selectElement(id)
  }, [selectElement, selectElements])

  const handleTransformEnd = useCallback((id: string, updates: Partial<FloorElement>) => {
    updateElement(id, { ...updates, x: updates.x != null ? snap(updates.x, gridSize, snapToGrid) : undefined, y: updates.y != null ? snap(updates.y, gridSize, snapToGrid) : undefined, width: updates.width != null ? snap(updates.width, gridSize, snapToGrid) : undefined, height: updates.height != null ? snap(updates.height, gridSize, snapToGrid) : undefined })
  }, [gridSize, snapToGrid, updateElement])

  // ── Ruler drag to create guide ────────────────────────────────────────────
  const handleRulerDragStart = useCallback((e: React.MouseEvent, axis: 'h' | 'v') => {
    e.preventDefault()
    const stage = stageRef.current; if (!stage) return
    const containerRect = stage.container().getBoundingClientRect()
    const id = crypto.randomUUID()
    const getPos = (clientX: number, clientY: number) => {
      const sp = stage.position(), ss = stage.scaleX()
      return axis === 'h' ? (clientY - containerRect.top - sp.y) / ss : (clientX - containerRect.left - sp.x) / ss
    }
    addGuide(id, axis, getPos(e.clientX, e.clientY))
    let rafId: number | null = null
    const onMove = (me: MouseEvent) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => { rafId = null; updateGuide(id, getPos(me.clientX, me.clientY)) })
    }
    const onUp = (ue: MouseEvent) => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
      if (rafId) cancelAnimationFrame(rafId)
      const final = getPos(ue.clientX, ue.clientY)
      if (final < 0) deleteGuide(id); else updateGuide(id, snap(final, gridSize, snapToGrid))
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [addGuide, updateGuide, deleteGuide, gridSize, snapToGrid])

  // ── Minimap click to navigate ─────────────────────────────────────────────
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const stage = stageRef.current, canvas = minimapCanvasRef.current; if (!stage || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const canvasX = ((e.clientX - rect.left) / rect.width) * LOGICAL_W
    const canvasY = ((e.clientY - rect.top) / rect.height) * LOGICAL_H
    const ss = stage.scaleX()
    stage.position({ x: width/2 - canvasX*ss, y: height/2 - canvasY*ss })
    stage.batchDraw(); drawMinimapRef.current(); drawRulersRef.current()
  }, [width, height])

  // ── Grid lines ────────────────────────────────────────────────────────────
  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const gridLines: React.ReactElement[] = []
  const canvasW = width / ZOOM_MIN, canvasH = height / ZOOM_MIN
  for (let x = 0; x < canvasW; x += gridSize) gridLines.push(<Line key={`v${x}`} points={[x,0,x,canvasH]} stroke={gridColor} strokeWidth={0.5} listening={false} />)
  for (let y = 0; y < canvasH; y += gridSize) gridLines.push(<Line key={`h${y}`} points={[0,y,canvasW,y]} stroke={gridColor} strokeWidth={0.5} listening={false} />)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`w-full h-full relative bg-gray-100 dark:bg-gray-950 overflow-hidden canvas-container ${isDragOver ? 'ring-2 ring-inset ring-blue-400' : ''}`}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
    >
      {/* Ruler corner */}
      <div className="absolute top-0 left-0 z-20 bg-gray-200 dark:bg-gray-800 border-b border-r border-gray-300 dark:border-gray-600" style={{ width: RULER_W, height: RULER_W }} />
      {/* Horizontal ruler */}
      <canvas
        ref={hRulerRef} className="absolute top-0 z-20" style={{ left: RULER_W, height: RULER_W, cursor: showGuides ? 'row-resize' : 'default' }}
        onMouseDown={(e) => { if (showGuides) handleRulerDragStart(e, 'h') }}
        title={showGuides ? 'Drag to create horizontal guide' : ''}
      />
      {/* Vertical ruler */}
      <canvas
        ref={vRulerRef} className="absolute left-0 z-20" style={{ top: RULER_W, width: RULER_W, cursor: showGuides ? 'col-resize' : 'default' }}
        onMouseDown={(e) => { if (showGuides) handleRulerDragStart(e, 'v') }}
        title={showGuides ? 'Drag to create vertical guide' : ''}
      />

      <Stage ref={stageRef} width={width} height={height} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <Layer listening={false}>{gridLines}</Layer>
        <Layer listening={false}>{elements.map(el => <ChairsForElement key={el.id} el={el} />)}</Layer>
        {showGuides && (
          <Layer>
            {guides.map(g => <GuideLine key={g.id} guide={g} snapToGrid={snapToGrid} gridSize={gridSize} onUpdate={updateGuide} onDelete={deleteGuide} />)}
          </Layer>
        )}
        <Layer>
          {elements.map(el => (
            <ElementShape key={el.id} element={el} isSelected={selectedIds.includes(el.id)}
              onSelect={handleSelect} onDragStart={handleElementDragStart}
              onDragMove={handleElementDragMove} onDragEnd={handleElementDragEnd} onTransformEnd={handleTransformEnd} />
          ))}
          <Transformer ref={trRef} rotateEnabled
            boundBoxFunc={(o, n) => (n.width < 20 || n.height < 20 ? o : n)}
            anchorStyleFunc={(a) => { if (a.hasName('rotater')) { a.fill('#3b82f6'); a.stroke('#2563eb') } }} />
          {selectionRect && (
            <Rect x={selectionRect.x} y={selectionRect.y} width={selectionRect.width} height={selectionRect.height}
              fill="rgba(59,130,246,0.07)" stroke="#3b82f6" strokeWidth={1} dash={[4,2]} listening={false} />
          )}
        </Layer>
      </Stage>

      {/* Minimap */}
      <div className="absolute bottom-3 right-3 z-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg opacity-75 hover:opacity-100 transition-opacity select-none">
        <div className="text-[9px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 text-center py-0.5 tracking-widest uppercase">map</div>
        <canvas ref={minimapCanvasRef} width={MINIMAP_W} height={MINIMAP_H} style={{ display: 'block', cursor: 'crosshair' }} onClick={handleMinimapClick} />
      </div>
    </div>
  )
}
