import React, { useState, useCallback } from 'react'
import { ShapeElement } from '../types'

interface ShapeDrawerProps {
  pageNumber: number
  zoom: number
  onShapeComplete: (shape: Omit<ShapeElement, 'id'>) => void
  shapeType: ShapeElement['shapeType']
}

interface DrawingState {
  isDrawing: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

const ShapeDrawer: React.FC<ShapeDrawerProps> = ({
  pageNumber,
  zoom,
  onShapeComplete,
  shapeType
}) => {
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null)
  const [shapeOptions, setShapeOptions] = useState({
    fillColor: '',
    strokeColor: '#000000',
    strokeWidth: 2
  })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / (zoom / 100)
    const y = (e.clientY - rect.top) / (zoom / 100)

    setDrawingState({
      isDrawing: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    })
  }, [zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingState?.isDrawing) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / (zoom / 100)
    const y = (e.clientY - rect.top) / (zoom / 100)

    setDrawingState(prev => prev ? {
      ...prev,
      currentX: x,
      currentY: y
    } : null)
  }, [drawingState, zoom])

  const handleMouseUp = useCallback(() => {
    if (!drawingState?.isDrawing) return

    const width = Math.abs(drawingState.currentX - drawingState.startX)
    const height = Math.abs(drawingState.currentY - drawingState.startY)
    
    // Minimum size for shapes
    if (width < 10 || height < 10) {
      setDrawingState(null)
      return
    }

    const x = Math.min(drawingState.startX, drawingState.currentX)
    const y = Math.min(drawingState.startY, drawingState.currentY)

    const shape: Omit<ShapeElement, 'id'> = {
      type: 'shape',
      pageNumber,
      x,
      y,
      width,
      height,
      shapeType,
      fillColor: shapeOptions.fillColor || undefined,
      strokeColor: shapeOptions.strokeColor,
      strokeWidth: shapeOptions.strokeWidth,
      rotation: 0,
      opacity: 1
    }

    onShapeComplete(shape)
    setDrawingState(null)
  }, [drawingState, pageNumber, shapeType, shapeOptions, onShapeComplete])

  const getShapePreview = () => {
    if (!drawingState?.isDrawing) return null

    const width = Math.abs(drawingState.currentX - drawingState.startX)
    const height = Math.abs(drawingState.currentY - drawingState.startY)
    const x = Math.min(drawingState.startX, drawingState.currentX) * (zoom / 100)
    const y = Math.min(drawingState.startY, drawingState.currentY) * (zoom / 100)
    const scaledWidth = width * (zoom / 100)
    const scaledHeight = height * (zoom / 100)

    const shapeStyle = {
      position: 'absolute' as const,
      left: `${x}px`,
      top: `${y}px`,
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      backgroundColor: shapeOptions.fillColor || 'transparent',
      border: `${shapeOptions.strokeWidth}px solid ${shapeOptions.strokeColor}`,
      borderRadius: shapeType === 'circle' ? '50%' : '0',
      pointerEvents: 'none' as const,
      opacity: 0.7
    }

    if (shapeType === 'line') {
      // For lines, we'll use a different approach
      const angle = Math.atan2(
        drawingState.currentY - drawingState.startY,
        drawingState.currentX - drawingState.startX
      ) * 180 / Math.PI

      const lineLength = Math.sqrt(width * width + height * height) * (zoom / 100)

      return (
        <div
          style={{
            position: 'absolute',
            left: `${drawingState.startX * (zoom / 100)}px`,
            top: `${drawingState.startY * (zoom / 100)}px`,
            width: `${lineLength}px`,
            height: `${shapeOptions.strokeWidth}px`,
            backgroundColor: shapeOptions.strokeColor,
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg)`,
            pointerEvents: 'none',
            opacity: 0.7
          }}
        />
      )
    }

    return <div style={shapeStyle} />
  }

  return (
    <>
      {/* Drawing Overlay */}
      <div
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ zIndex: 20 }}
      >
        {getShapePreview()}
      </div>

      {/* Shape Options Panel */}
      <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-30">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900">
            Drawing: {shapeType}
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600">Stroke:</label>
            <input
              type="color"
              value={shapeOptions.strokeColor}
              onChange={(e) => setShapeOptions(prev => ({ ...prev, strokeColor: e.target.value }))}
              className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="range"
              min="1"
              max="10"
              value={shapeOptions.strokeWidth}
              onChange={(e) => setShapeOptions(prev => ({ ...prev, strokeWidth: parseInt(e.target.value) }))}
              className="w-12"
            />
            <span className="text-xs text-gray-500">{shapeOptions.strokeWidth}px</span>
          </div>
          
          {shapeType !== 'line' && (
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-600">Fill:</label>
              <input
                type="color"
                value={shapeOptions.fillColor}
                onChange={(e) => setShapeOptions(prev => ({ ...prev, fillColor: e.target.value }))}
                className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
              />
              <button
                onClick={() => setShapeOptions(prev => ({ ...prev, fillColor: '' }))}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            Click and drag to draw
          </div>
        </div>
      </div>
    </>
  )
}

export default ShapeDrawer