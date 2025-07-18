import React, { useState, useRef, useCallback, useEffect } from 'react'
import { AnnotationElement } from '../types'

interface AnnotationToolProps {
  isActive: boolean
  annotationType: AnnotationElement['annotationType']
  color: string
  strokeWidth: number
  onCreateAnnotation: (annotation: Omit<AnnotationElement, 'id'>) => void
  pageNumber: number
  zoom: number
  currentUser: string
}

interface DrawingState {
  isDrawing: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  points: Array<{ x: number; y: number }>
}

const AnnotationTool: React.FC<AnnotationToolProps> = ({
  isActive,
  annotationType,
  color,
  strokeWidth,
  onCreateAnnotation,
  pageNumber,
  zoom,
  currentUser
}) => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    points: []
  })
  const [showPreview, setShowPreview] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / (zoom / 100)
    const y = (e.clientY - rect.top) / (zoom / 100)

    setDrawingState({
      isDrawing: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      points: annotationType === 'freehand' ? [{ x, y }] : []
    })
    setShowPreview(true)
  }, [isActive, annotationType, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingState.isDrawing || !isActive) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / (zoom / 100)
    const y = (e.clientY - rect.top) / (zoom / 100)

    setDrawingState(prev => ({
      ...prev,
      currentX: x,
      currentY: y,
      points: annotationType === 'freehand' 
        ? [...prev.points, { x, y }]
        : prev.points
    }))
  }, [drawingState.isDrawing, isActive, annotationType, zoom])

  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || !isActive) return

    const { startX, startY, currentX, currentY, points } = drawingState

    // Calculate bounds
    const minX = Math.min(startX, currentX)
    const minY = Math.min(startY, currentY)
    const maxX = Math.max(startX, currentX)
    const maxY = Math.max(startY, currentY)

    // Minimum size for annotations
    const minSize = 10
    const width = Math.max(maxX - minX, minSize)
    const height = Math.max(maxY - minY, minSize)

    // Create annotation
    const annotation: Omit<AnnotationElement, 'id'> = {
      type: 'annotation',
      pageNumber,
      x: minX,
      y: minY,
      width,
      height,
      annotationType,
      content: getDefaultContent(annotationType),
      color,
      author: currentUser,
      createdAt: new Date(),
      modifiedAt: new Date(),
      opacity: annotationType === 'highlight' ? 0.3 : 1,
      rotation: 0,
      strokeWidth: strokeWidth,
      strokeColor: color,
      fillColor: annotationType === 'highlight' ? color : undefined,
      points: annotationType === 'freehand' ? points : undefined,
      targetX: annotationType === 'arrow' || annotationType === 'callout' ? currentX : undefined,
      targetY: annotationType === 'arrow' || annotationType === 'callout' ? currentY : undefined
    }

    onCreateAnnotation(annotation)

    // Reset state
    setDrawingState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      points: []
    })
    setShowPreview(false)
  }, [drawingState, isActive, annotationType, pageNumber, color, strokeWidth, currentUser, onCreateAnnotation])

  const getDefaultContent = (type: AnnotationElement['annotationType']): string => {
    switch (type) {
      case 'note':
        return 'Click to add note'
      case 'stamp':
        return 'APPROVED'
      case 'callout':
        return 'Important note'
      default:
        return ''
    }
  }

  const renderPreview = () => {
    if (!showPreview || !drawingState.isDrawing) return null

    const { startX, startY, currentX, currentY, points } = drawingState
    const scaledZoom = zoom / 100

    switch (annotationType) {
      case 'highlight':
        return (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${Math.min(startX, currentX) * scaledZoom}px`,
              top: `${Math.min(startY, currentY) * scaledZoom}px`,
              width: `${Math.abs(currentX - startX) * scaledZoom}px`,
              height: `${Math.abs(currentY - startY) * scaledZoom}px`,
              backgroundColor: color,
              opacity: 0.3
            }}
          />
        )

      case 'note':
        return (
          <div
            className="absolute pointer-events-none border-2 border-dashed"
            style={{
              left: `${Math.min(startX, currentX) * scaledZoom}px`,
              top: `${Math.min(startY, currentY) * scaledZoom}px`,
              width: `${Math.abs(currentX - startX) * scaledZoom}px`,
              height: `${Math.abs(currentY - startY) * scaledZoom}px`,
              borderColor: color,
              backgroundColor: `${color}20`
            }}
          />
        )

      case 'freehand':
        return (
          <svg
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <path
              d={`M ${points.map(p => `${p.x * scaledZoom},${p.y * scaledZoom}`).join(' L ')}`}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )

      case 'arrow':
        return (
          <svg
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={color}
                />
              </marker>
            </defs>
            <line
              x1={startX * scaledZoom}
              y1={startY * scaledZoom}
              x2={currentX * scaledZoom}
              y2={currentY * scaledZoom}
              stroke={color}
              strokeWidth={strokeWidth}
              markerEnd="url(#arrowhead)"
            />
          </svg>
        )

      case 'callout':
        return (
          <svg
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <path
              d={`M ${startX * scaledZoom},${startY * scaledZoom} Q ${((startX + currentX) / 2) * scaledZoom},${((startY + currentY) / 2 - 20) * scaledZoom} ${currentX * scaledZoom},${currentY * scaledZoom}`}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={currentX * scaledZoom}
              cy={currentY * scaledZoom}
              r="5"
              fill={color}
            />
          </svg>
        )

      case 'stamp':
        return (
          <div
            className="absolute pointer-events-none border-2 rounded flex items-center justify-center text-xs font-bold"
            style={{
              left: `${Math.min(startX, currentX) * scaledZoom}px`,
              top: `${Math.min(startY, currentY) * scaledZoom}px`,
              width: `${Math.abs(currentX - startX) * scaledZoom}px`,
              height: `${Math.abs(currentY - startY) * scaledZoom}px`,
              borderColor: color,
              color: color,
              backgroundColor: `${color}10`
            }}
          >
            APPROVED
          </div>
        )

      default:
        return null
    }
  }

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingState.isDrawing) {
        setDrawingState({
          isDrawing: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          points: []
        })
        setShowPreview(false)
      }
    }

    if (isActive) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, drawingState.isDrawing])

  if (!isActive) return null

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair z-10"
      style={{ cursor: getCursor(annotationType) }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {renderPreview()}
    </div>
  )
}

const getCursor = (type: AnnotationElement['annotationType']): string => {
  switch (type) {
    case 'highlight':
      return 'text'
    case 'note':
      return 'copy'
    case 'freehand':
      return 'pencil'
    case 'arrow':
      return 'crosshair'
    case 'callout':
      return 'help'
    case 'stamp':
      return 'stamp'
    default:
      return 'crosshair'
  }
}

export default AnnotationTool