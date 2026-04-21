'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Group, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useBuilderStore } from '@/lib/store/builderStore'
import type { FloorElement, ElementType } from '@/types/floorplan'

const ZOOM_MIN = 0.1
const ZOOM_MAX = 5
const ZOOM_FACTOR = 1.1

function snap(value: number, gridSize: number, on: boolean): number {
  return on ? Math.round(value / gridSize) * gridSize : value
}

function getDefaultColor(type: ElementType): string {
  switch (type) {
    case 'table-round':
    case 'table-rect':
    case 'table-square': return '#fef3c7'
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
    case 'table-round':
    case 'table-rect':
    case 'table-square': return 'T1'
    case 'zone': return 'Zone'
    case 'bar': return 'Bar'
    default: return ''
  }
}

const DEFAULT_SIZES: Record<ElementType, { width: number; height: number }> = {
  'table-round': { width: 60, height: 60 },
  'table-rect': { width: 80, height: 60 },
  'table-square': { width: 60, height: 60 },
  'wall': { width: 120, height: 12 },
  'zone': { width: 160, height: 120 },
  'bar': { width: 120, height: 40 },
  'plant': { width: 30, height: 30 },
  'couch': { width: 100, height: 40 },
}

// ── Chair previews ─────────────────────────────────────────────────────────────

function ChairsForElement({ el }: { el: FloorElement }) {
  const cap = el.capacity ?? 0
  if (cap === 0 || !el.type.startsWith('table')) return null

  const chairFill = '#a8a29e'
  const chairStroke = '#78716c'
  const capped = Math.min(cap, 12)

  return (
    <Group x={el.x} y={el.y} rotation={el.rotation ?? 0} listening={false}>
      {el.type === 'table-round' ? (
        Array.from({ length: capped }, (_, i) => {
          const angle = ((270 + (360 / capped) * i) * Math.PI) / 180
          return (
            <Circle
              key={i}
              x={el.width / 2 + (el.width / 2 + 10) * Math.cos(angle)}
              y={el.height / 2 + (el.height / 2 + 10) * Math.sin(angle)}
              radius={5}
              fill={chairFill}
              stroke={chairStroke}
              strokeWidth={0.5}
            />
          )
        })
      ) : (
        <>
          {Array.from({ length: Math.min(Math.ceil(capped / 2), 8) }, (_, i) => {
            const n = Math.ceil(capped / 2)
            return (
              <Rect key={`t${i}`} x={((i + 1) / (n + 1)) * el.width - 4.5} y={-9}
                width={9} height={6} fill={chairFill} stroke={chairStroke} strokeWidth={0.5} cornerRadius={2} />
            )
          })}
          {Array.from({ length: Math.min(Math.floor(capped / 2), 8) }, (_, i) => {
            const n = Math.floor(capped / 2)
            return (
              <Rect key={`b${i}`} x={((i + 1) / (n + 1)) * el.width - 4.5} y={el.height + 3}
                width={9} height={6} fill={chairFill} stroke={chairStroke} strokeWidth={0.5} cornerRadius={2} />
            )
          })}
        </>
      )}
    </Group>
  )
}

// ── ElementShape ───────────────────────────────────────────────────────────────

interface ElementShapeProps {
  element: FloorElement
  isSelected: boolean
  onSelect: (id: string, shiftKey: boolean) => void
  onDragStart: (element: FloorElement) => void
  onDragMove: (id: string, x: number, y: number) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, updates: Partial<FloorElement>) => void
}

function ElementShape({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd }: ElementShapeProps) {
  const shapeRef = useRef<Konva.Group>(null)

  const handleTransformEnd = () => {
    if (!shapeRef.current) return
    const node = shapeRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    onTransformEnd(element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, element.width * scaleX),
      height: Math.max(20, element.height * scaleY),
      rotation: node.rotation(),
    })
  }

  const strokeColor = isSelected ? '#3b82f6' : '#9ca3af'
  const strokeWidth = isSelected ? 2 : 1
  const fill = element.color || getDefaultColor(element.type)
  const labelProps = {
    fontSize: 11,
    fill: element.type === 'wall' ? '#fff' : '#374151',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    align: 'center' as const,
  }

  return (
    <Group
      id={element.id}
      ref={shapeRef}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={() => onSelect(element.id, false)}
      onDragStart={() => onDragStart(element)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      onTransformEnd={handleTransformEnd}
    >
      {element.type === 'table-round' ? (
        <>
          <Circle x={element.width / 2} y={element.height / 2} radius={element.width / 2}
            fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} />
          {element.label && (
            <Text x={0} y={element.height / 2 - 6} width={element.width} text={element.label} {...labelProps} />
          )}
        </>
      ) : element.type === 'zone' ? (
        <>
          <Rect width={element.width} height={element.height} fill={fill} opacity={0.25}
            stroke={strokeColor} strokeWidth={strokeWidth} dash={[6, 3]} cornerRadius={6} />
          {element.label && (
            <Text x={4} y={element.height / 2 - 6} width={element.width - 8} text={element.label}
              {...labelProps} fill="#1d4ed8" />
          )}
        </>
      ) : (
        <>
          <Rect width={element.width} height={element.height} fill={fill}
            stroke={strokeColor} strokeWidth={strokeWidth}
            cornerRadius={element.type === 'plant' ? element.width / 2 : 3} />
          {element.label && (
            <Text x={4} y={element.height / 2 - 6} width={element.width - 8} text={element.label} {...labelProps} />
          )}
        </>
      )}
    </Group>
  )
}

// ── CanvasInner ────────────────────────────────────────────────────────────────

type SelRect = { x: number; y: number; width: number; height: number }

interface Props {
  width: number
  height: number
}

export default function CanvasInner({ width, height }: Props) {
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const isPanning = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })
  const isSpaceDown = useRef(false)
  const isAltDown = useRef(false)
  const prevScale = useRef(1)

  // Multi-drag: tracks start positions of all selected elements
  const multiDragAnchor = useRef<{ draggedId: string; startPos: Record<string, { x: number; y: number }> } | null>(null)

  // Selection rectangle
  const isSelecting = useRef(false)
  const selectionStart = useRef<{ x: number; y: number } | null>(null)
  const selectionRectRef = useRef<SelRect | null>(null)
  const [selectionRect, setSelectionRect] = useState<SelRect | null>(null)

  const [isDragOver, setIsDragOver] = useState(false)

  const {
    elements,
    selectedIds,
    snapToGrid,
    gridSize,
    scale,
    isDark,
    addElement,
    updateElement,
    updateElements,
    selectElement,
    selectElements,
    setScale,
  } = useBuilderStore()

  // Sync stage scale when changed externally (slider)
  useEffect(() => {
    if (prevScale.current === scale) return
    prevScale.current = scale
    const stage = stageRef.current
    if (!stage) return
    if (Math.abs(stage.scaleX() - scale) < 0.001) return
    const oldScale = stage.scaleX()
    const cx = width / 2
    const cy = height / 2
    stage.scale({ x: scale, y: scale })
    stage.position({
      x: cx - (cx - stage.x()) * (scale / oldScale),
      y: cy - (cy - stage.y()) * (scale / oldScale),
    })
  }, [scale, width, height])

  // Attach Transformer to all selected nodes
  const selectedIdsKey = selectedIds.join(',')
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    if (selectedIds.length > 0) {
      const nodes = selectedIds
        .map((id) => stage.findOne(`#${id}`))
        .filter((n): n is Konva.Node => n !== null)
      tr.nodes(nodes)
    } else {
      tr.nodes([])
    }
    tr.getLayer()?.batchDraw()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdsKey, elements])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') isAltDown.current = true
      if (e.code === 'Space' && !e.repeat) {
        isSpaceDown.current = true
        const container = stageRef.current?.container()
        if (container) container.style.cursor = 'grab'
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) useBuilderStore.getState().redo()
        else useBuilderStore.getState().undo()
      }

      // Delete / Backspace — delete all selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement
        if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return
        useBuilderStore.getState().deleteSelected()
      }

      // Arrow keys — nudge selected elements
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const active = document.activeElement
        if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return
        const { selectedIds: ids, elements: els, gridSize: gs } = useBuilderStore.getState()
        if (ids.length === 0) return
        e.preventDefault()
        const step = e.shiftKey ? gs : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        useBuilderStore.getState().updateElements(
          ids.flatMap((id) => {
            const el = els.find((el) => el.id === id)
            return el ? [{ id, updates: { x: el.x + dx, y: el.y + dy } }] : []
          })
        )
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') isAltDown.current = false
      if (e.code === 'Space') {
        isSpaceDown.current = false
        const container = stageRef.current?.container()
        if (container) container.style.cursor = 'default'
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    const direction = e.evt.deltaY < 0 ? 1 : -1
    const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldScale * (direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR)))
    stage.scale({ x: newScale, y: newScale })
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
    prevScale.current = newScale
    setScale(newScale)
  }, [setScale])

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || isSpaceDown.current) {
      isPanning.current = true
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      const container = stageRef.current?.container()
      if (container) container.style.cursor = 'grabbing'
      e.evt.preventDefault()
      return
    }
    if (e.target === e.target.getStage()) {
      // Start selection rectangle
      const stage = stageRef.current
      if (stage) {
        const pos = stage.getRelativePointerPosition()
        if (pos) {
          isSelecting.current = true
          selectionStart.current = pos
          const r = { x: pos.x, y: pos.y, width: 0, height: 0 }
          selectionRectRef.current = r
          setSelectionRect(r)
        }
      }
    }
  }, [])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      const stage = stageRef.current
      if (!stage) return
      const dx = e.evt.clientX - lastPanPos.current.x
      const dy = e.evt.clientY - lastPanPos.current.y
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      stage.position({ x: stage.x() + dx, y: stage.y() + dy })
      return
    }
    if (isSelecting.current && selectionStart.current) {
      const stage = stageRef.current
      const pos = stage?.getRelativePointerPosition()
      if (!pos) return
      const start = selectionStart.current
      const r: SelRect = {
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width: Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
      }
      selectionRectRef.current = r
      setSelectionRect(r)
    }
  }, [])

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      isPanning.current = false
      const container = stageRef.current?.container()
      if (container) container.style.cursor = isSpaceDown.current ? 'grab' : 'default'
    }
    if (isSelecting.current) {
      isSelecting.current = false
      const rect = selectionRectRef.current
      if (rect && (rect.width > 5 || rect.height > 5)) {
        const els = useBuilderStore.getState().elements
        const found = els
          .filter((el) => !(el.x + el.width < rect.x || el.x > rect.x + rect.width || el.y + el.height < rect.y || el.y > rect.y + rect.height))
          .map((el) => el.id)
        if (e.evt.shiftKey) {
          const prev = useBuilderStore.getState().selectedIds
          selectElements(Array.from(new Set([...prev, ...found])))
        } else {
          selectElements(found)
        }
      } else if (!e.evt.shiftKey) {
        selectElement(null)
      }
      selectionRectRef.current = null
      setSelectionRect(null)
    }
  }, [selectElement, selectElements])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const stage = stageRef.current
    if (!stage) return
    const type = e.dataTransfer.getData('elementType') as ElementType
    if (!type) return
    stage.setPointersPositions(e.nativeEvent as unknown as Event)
    const pos = stage.getRelativePointerPosition()
    if (!pos) return
    const size = DEFAULT_SIZES[type] ?? { width: 60, height: 60 }
    addElement({
      id: crypto.randomUUID(),
      type,
      x: snap(pos.x - size.width / 2, gridSize, snapToGrid),
      y: snap(pos.y - size.height / 2, gridSize, snapToGrid),
      ...size,
      rotation: 0,
      label: getDefaultLabel(type),
      capacity: type.startsWith('table') ? 2 : undefined,
    })
  }, [addElement, gridSize, snapToGrid])

  // ── Selection-aware drag handlers ─────────────────────────────────────────

  const handleElementDragStart = useCallback((element: FloorElement) => {
    // Alt+drag: clone element in place, let original drag away
    if (isAltDown.current) {
      addElement({ ...element, id: crypto.randomUUID() })
    }
    // Multi-drag: capture start positions of all selected elements
    const { selectedIds: ids, elements: els } = useBuilderStore.getState()
    if (ids.includes(element.id) && ids.length > 1) {
      const startPos: Record<string, { x: number; y: number }> = {}
      for (const id of ids) {
        const el = els.find((e) => e.id === id)
        if (el) startPos[id] = { x: el.x, y: el.y }
      }
      multiDragAnchor.current = { draggedId: element.id, startPos }
    } else {
      multiDragAnchor.current = null
    }
  }, [addElement])

  const handleElementDragMove = useCallback((id: string, currentX: number, currentY: number) => {
    const anchor = multiDragAnchor.current
    if (!anchor || anchor.draggedId !== id) return
    const dx = currentX - anchor.startPos[id].x
    const dy = currentY - anchor.startPos[id].y
    const stage = stageRef.current
    if (!stage) return
    for (const otherId of Object.keys(anchor.startPos)) {
      if (otherId === id) continue
      const node = stage.findOne(`#${otherId}`)
      const start = anchor.startPos[otherId]
      if (node && start) {
        node.x(start.x + dx)
        node.y(start.y + dy)
      }
    }
  }, [])

  const handleElementDragEnd = useCallback((id: string, rawX: number, rawY: number) => {
    const snappedX = snap(rawX, gridSize, snapToGrid)
    const snappedY = snap(rawY, gridSize, snapToGrid)
    const anchor = multiDragAnchor.current

    if (anchor && anchor.draggedId === id) {
      // Batch-update all selected elements using the same delta
      const dx = snappedX - anchor.startPos[id].x
      const dy = snappedY - anchor.startPos[id].y
      updateElements(
        Object.entries(anchor.startPos).map(([eid, start]) => ({
          id: eid,
          updates: {
            x: eid === id ? snappedX : snap(start.x + dx, gridSize, snapToGrid),
            y: eid === id ? snappedY : snap(start.y + dy, gridSize, snapToGrid),
          },
        }))
      )
      multiDragAnchor.current = null
    } else {
      updateElement(id, { x: snappedX, y: snappedY })
    }
  }, [gridSize, snapToGrid, updateElement, updateElements])

  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    const { selectedIds: ids } = useBuilderStore.getState()
    if (shiftKey) {
      selectElements(ids.includes(id) ? ids.filter((s) => s !== id) : [...ids, id])
    } else {
      selectElement(id)
    }
  }, [selectElement, selectElements])

  const handleTransformEnd = useCallback((id: string, updates: Partial<FloorElement>) => {
    updateElement(id, {
      ...updates,
      x: updates.x !== undefined ? snap(updates.x, gridSize, snapToGrid) : undefined,
      y: updates.y !== undefined ? snap(updates.y, gridSize, snapToGrid) : undefined,
      width: updates.width !== undefined ? snap(updates.width, gridSize, snapToGrid) : undefined,
      height: updates.height !== undefined ? snap(updates.height, gridSize, snapToGrid) : undefined,
    })
  }, [gridSize, snapToGrid, updateElement])

  // ── Grid lines ─────────────────────────────────────────────────────────────

  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const gridLines: React.ReactElement[] = []
  const canvasW = width / ZOOM_MIN
  const canvasH = height / ZOOM_MIN
  for (let x = 0; x < canvasW; x += gridSize) {
    gridLines.push(<Line key={`v${x}`} points={[x, 0, x, canvasH]} stroke={gridColor} strokeWidth={0.5} listening={false} />)
  }
  for (let y = 0; y < canvasH; y += gridSize) {
    gridLines.push(<Line key={`h${y}`} points={[0, y, canvasW, y]} stroke={gridColor} strokeWidth={0.5} listening={false} />)
  }

  return (
    <div
      className={`w-full h-full bg-gray-100 dark:bg-gray-950 overflow-hidden canvas-container ${isDragOver ? 'ring-2 ring-inset ring-blue-400' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer listening={false}>{gridLines}</Layer>

        {/* Chair previews — non-interactive, below tables */}
        <Layer listening={false}>
          {elements.map((el) => <ChairsForElement key={el.id} el={el} />)}
        </Layer>

        <Layer>
          {elements.map((el) => (
            <ElementShape
              key={el.id}
              element={el}
              isSelected={selectedIds.includes(el.id)}
              onSelect={handleSelect}
              onDragStart={handleElementDragStart}
              onDragMove={handleElementDragMove}
              onDragEnd={handleElementDragEnd}
              onTransformEnd={handleTransformEnd}
            />
          ))}
          <Transformer
            ref={trRef}
            rotateEnabled
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
            anchorStyleFunc={(anchor) => {
              if (anchor.hasName('rotater')) {
                anchor.fill('#3b82f6')
                anchor.stroke('#2563eb')
              }
            }}
          />
          {selectionRect && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="rgba(59,130,246,0.07)"
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 2]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
