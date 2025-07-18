import React, { useState, useCallback } from 'react'
import { PDFElement } from '../types'

interface ElementHandlesProps {
  element: PDFElement
  zoom: number
  onUpdate: (updates: Partial<PDFElement>) => void
  onDelete: () => void
}

interface DragState {
  isDragging: boolean
  dragType: 'move' | 'resize'
  resizeHandle?: string
  startX: number
  startY: number
  startElementX: number
  startElementY: number
  startElementWidth: number
  startElementHeight: number
}

const ElementHandles: React.FC<ElementHandlesProps> = ({
  element,
  zoom,
  onUpdate,
  onDelete
}) => {
  const [dragState, setDragState] = useState<DragState | null>(null)

  const scaledX = (element.x * zoom) / 100
  const scaledY = (element.y * zoom) / 100
  const scaledWidth = (element.width * zoom) / 100
  const scaledHeight = (element.height * zoom) / 100

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize', resizeHandle?: string) => {
    e.stopPropagation()
    e.preventDefault()

    setDragState({
      isDragging: true,
      dragType: type,
      resizeHandle,
      startX: e.clientX,
      startY: e.clientY,
      startElementX: element.x,
      startElementY: element.y,
      startElementWidth: element.width,
      startElementHeight: element.height
    })

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState?.isDragging) return

      const deltaX = (e.clientX - dragState.startX) / (zoom / 100)
      const deltaY = (e.clientY - dragState.startY) / (zoom / 100)

      if (dragState.dragType === 'move') {
        onUpdate({
          x: dragState.startElementX + deltaX,
          y: dragState.startElementY + deltaY
        })
      } else if (dragState.dragType === 'resize') {
        let newWidth = dragState.startElementWidth
        let newHeight = dragState.startElementHeight
        let newX = dragState.startElementX
        let newY = dragState.startElementY

        switch (dragState.resizeHandle) {
          case 'nw':
            newWidth = dragState.startElementWidth - deltaX
            newHeight = dragState.startElementHeight - deltaY
            newX = dragState.startElementX + deltaX
            newY = dragState.startElementY + deltaY
            break
          case 'n':
            newHeight = dragState.startElementHeight - deltaY
            newY = dragState.startElementY + deltaY
            break
          case 'ne':
            newWidth = dragState.startElementWidth + deltaX
            newHeight = dragState.startElementHeight - deltaY
            newY = dragState.startElementY + deltaY
            break
          case 'w':
            newWidth = dragState.startElementWidth - deltaX
            newX = dragState.startElementX + deltaX
            break
          case 'e':
            newWidth = dragState.startElementWidth + deltaX
            break
          case 'sw':
            newWidth = dragState.startElementWidth - deltaX
            newHeight = dragState.startElementHeight + deltaY
            newX = dragState.startElementX + deltaX
            break
          case 's':
            newHeight = dragState.startElementHeight + deltaY
            break
          case 'se':
            newWidth = dragState.startElementWidth + deltaX
            newHeight = dragState.startElementHeight + deltaY
            break
        }

        // Minimum size constraints
        newWidth = Math.max(20, newWidth)
        newHeight = Math.max(20, newHeight)

        onUpdate({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        })
      }
    }

    const handleMouseUp = () => {
      setDragState(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [element, zoom, onUpdate, dragState])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onDelete()
    }
  }, [onDelete])

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Selection Border */}
      <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none">
        {/* Move Handle (center) */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded cursor-move pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'move')}
          title="Move"
        >
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13,11H18L16.5,9.5L17.92,8.08L21.84,12L17.92,15.92L16.5,14.5L18,13H13V18L14.5,16.5L15.92,17.92L12,21.84L8.08,17.92L9.5,16.5L11,18V13H6L7.5,14.5L6.08,15.92L2.16,12L6.08,8.08L7.5,9.5L6,11H11V6L9.5,7.5L8.08,6.08L12,2.16L15.92,6.08L14.5,7.5L13,6V11Z" />
            </svg>
          </div>
        </div>

        {/* Resize Handles */}
        {/* Corner handles */}
        <div
          className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded cursor-nw-resize pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
          title="Resize"
        />
        <div
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded cursor-ne-resize pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
          title="Resize"
        />
        <div
          className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded cursor-sw-resize pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
          title="Resize"
        />
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded cursor-se-resize pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
          title="Resize"
        />

        {/* Edge handles */}
        <div
          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded cursor-n-resize pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'n')}
          title="Resize"
        />
        <div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded cursor-s-resize pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 's')}
          title="Resize"
        />
        <div
          className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded cursor-w-resize pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'w')}
          title="Resize"
        />
        <div
          className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded cursor-e-resize pointer-events-auto"
          onMouseDown={(e) => handleMouseDown(e, 'resize', 'e')}
          title="Resize"
        />

        {/* Delete Button */}
        <button
          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center pointer-events-auto"
          onClick={onDelete}
          title="Delete"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ElementHandles