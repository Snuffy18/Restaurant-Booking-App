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

interface ElementShapeProps {
  element: FloorElement
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, updates: Partial<FloorElement>) => void
}

function ElementShape({ element, isSelected, onSelect, onDragEnd, onTransformEnd }: ElementShapeProps) {
  const shapeRef = useRef<Konva.Group>(null)

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(element.id, e.target.x(), e.target.y())
  }

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
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {element.type === 'table-round' ? (
        <>
          <Circle
            x={element.width / 2}
            y={element.height / 2}
            radius={element.width / 2}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {element.label && (
            <Text
              x={0}
              y={element.height / 2 - 6}
              width={element.width}
              text={element.label}
              {...labelProps}
            />
          )}
        </>
      ) : element.type === 'zone' ? (
        <>
          <Rect
            width={element.width}
            height={element.height}
            fill={fill}
            opacity={0.25}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dash={[6, 3]}
            cornerRadius={6}
          />
          {element.label && (
            <Text
              x={4}
              y={element.height / 2 - 6}
              width={element.width - 8}
              text={element.label}
              {...labelProps}
              fill="#1d4ed8"
            />
          )}
        </>
      ) : (
        <>
          <Rect
            width={element.width}
            height={element.height}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={element.type === 'plant' ? element.width / 2 : 3}
          />
          {element.label && (
            <Text
              x={4}
              y={element.height / 2 - 6}
              width={element.width - 8}
              text={element.label}
              {...labelProps}
            />
          )}
        </>
      )}
    </Group>
  )
}

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
  const [isDragOver, setIsDragOver] = useState(false)

  const {
    elements,
    selectedId,
    snapToGrid,
    gridSize,
    addElement,
    updateElement,
    selectElement,
  } = useBuilderStore()

  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return

    if (selectedId) {
      const node = stage.findOne(`#${selectedId}`)
      if (node) {
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
        return
      }
    }
    tr.nodes([])
    tr.getLayer()?.batchDraw()
  }, [selectedId, elements])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        isSpaceDown.current = true
        const container = stageRef.current?.container()
        if (container) container.style.cursor = 'grab'
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          useBuilderStore.getState().redo()
        } else {
          useBuilderStore.getState().undo()
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const active = document.activeElement
        if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return
        useBuilderStore.getState().deleteElement(selectedId)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
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
  }, [selectedId])

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
  }, [])

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || isSpaceDown.current) {
      isPanning.current = true
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      const container = stageRef.current?.container()
      if (container) container.style.cursor = 'grabbing'
      e.evt.preventDefault()
    }
    if (e.target === e.target.getStage()) {
      selectElement(null)
    }
  }, [selectElement])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning.current) return
    const stage = stageRef.current
    if (!stage) return
    const dx = e.evt.clientX - lastPanPos.current.x
    const dy = e.evt.clientY - lastPanPos.current.y
    lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY }
    stage.position({ x: stage.x() + dx, y: stage.y() + dy })
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    const container = stageRef.current?.container()
    if (container) container.style.cursor = isSpaceDown.current ? 'grab' : 'default'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

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
    const x = snap(pos.x - size.width / 2, gridSize, snapToGrid)
    const y = snap(pos.y - size.height / 2, gridSize, snapToGrid)

    addElement({
      id: crypto.randomUUID(),
      type,
      x,
      y,
      ...size,
      rotation: 0,
      label: getDefaultLabel(type),
      capacity: type.startsWith('table') ? 2 : undefined,
    })
  }, [addElement, gridSize, snapToGrid])

  const handleDragEnd = useCallback((id: string, rawX: number, rawY: number) => {
    const snappedX = snap(rawX, gridSize, snapToGrid)
    const snappedY = snap(rawY, gridSize, snapToGrid)
    updateElement(id, { x: snappedX, y: snappedY })
  }, [gridSize, snapToGrid, updateElement])

  const handleTransformEnd = useCallback((id: string, updates: Partial<FloorElement>) => {
    const snappedUpdates = {
      ...updates,
      x: updates.x !== undefined ? snap(updates.x, gridSize, snapToGrid) : undefined,
      y: updates.y !== undefined ? snap(updates.y, gridSize, snapToGrid) : undefined,
      width: updates.width !== undefined ? snap(updates.width, gridSize, snapToGrid) : undefined,
      height: updates.height !== undefined ? snap(updates.height, gridSize, snapToGrid) : undefined,
    }
    updateElement(id, snappedUpdates)
  }, [gridSize, snapToGrid, updateElement])

  const gridLines: React.ReactElement[] = []
  const canvasW = width / ZOOM_MIN
  const canvasH = height / ZOOM_MIN
  for (let x = 0; x < canvasW; x += gridSize) {
    gridLines.push(<Line key={`v${x}`} points={[x, 0, x, canvasH]} stroke="#e5e7eb" strokeWidth={0.5} listening={false} />)
  }
  for (let y = 0; y < canvasH; y += gridSize) {
    gridLines.push(<Line key={`h${y}`} points={[0, y, canvasW, y]} stroke="#e5e7eb" strokeWidth={0.5} listening={false} />)
  }

  return (
    <div
      className={`w-full h-full bg-gray-100 overflow-hidden canvas-container ${isDragOver ? 'ring-2 ring-inset ring-blue-400' : ''}`}
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
        <Layer listening={false}>
          {gridLines}
        </Layer>
        <Layer>
          {elements.map((el) => (
            <ElementShape
              key={el.id}
              element={el}
              isSelected={el.id === selectedId}
              onSelect={selectElement}
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
            />
          ))}
          <Transformer
            ref={trRef}
            rotateEnabled
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) return oldBox
              return newBox
            }}
            anchorStyleFunc={(anchor) => {
              if (anchor.hasName('rotater')) {
                anchor.fill('#3b82f6')
                anchor.stroke('#2563eb')
              }
            }}
          />
        </Layer>
      </Stage>
    </div>
  )
}
