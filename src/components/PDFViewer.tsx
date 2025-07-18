import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, PDFPage, PDFElement, ShapeElement } from '../types'
import TextEditor from './TextEditor'
import ImageUploader from './ImageUploader'
import ElementHandles from './ElementHandles'
import ShapeDrawer from './ShapeDrawer'

interface PDFViewerProps {
  document: PDFDocument | null
  zoom: number
  selectedTool: string
  elements: PDFElement[]
  selectedElementIds: string[]
  highlightedElementId?: string | null
  onPageClick?: (pageNumber: number, x: number, y: number) => void
  onAddTextElement?: (pageNumber: number, x: number, y: number, text: string) => void
  onAddImageElement?: (pageNumber: number, x: number, y: number, src: string, width: number, height: number) => void
  onAddShapeElement?: (pageNumber: number, shape: Omit<ShapeElement, 'id' | 'pageNumber'>) => void
  onSelectElement?: (elementId: string) => void
  onUpdateElement?: (elementId: string, updates: Partial<PDFElement>) => void
  onDeleteElement?: (elementId: string) => void
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  document,
  zoom,
  selectedTool,
  elements,
  selectedElementIds,
  highlightedElementId,
  onPageClick,
  onAddTextElement,
  onAddImageElement,
  onAddShapeElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderedPages, setRenderedPages] = useState<Map<number, string>>(new Map())
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [textEditorPosition, setTextEditorPosition] = useState({ x: 0, y: 0, pageNumber: 0 })
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [imageUploaderPosition, setImageUploaderPosition] = useState({ x: 0, y: 0, pageNumber: 0 })

  // Load PDF document
  useEffect(() => {
    if (!document || document.pages.length === 0) {
      setPdfDoc(null)
      setRenderedPages(new Map())
      return
    }

    // For now, we'll use the existing rendered pages from the document
    // In a real implementation, we'd reload the PDF from the original bytes
    const pageMap = new Map<number, string>()
    document.pages.forEach((page) => {
      if (page.content) {
        pageMap.set(page.pageNumber, page.content)
      }
    })
    setRenderedPages(pageMap)
  }, [document])

  const handlePageClick = useCallback((pageNumber: number, event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const x = (event.clientX - rect.left) / (zoom / 100)
    const y = (event.clientY - rect.top) / (zoom / 100)
    
    if (selectedTool === 'text') {
      // Show text editor
      setTextEditorPosition({
        x: event.clientX,
        y: event.clientY,
        pageNumber
      })
      setShowTextEditor(true)
    } else if (selectedTool === 'image') {
      // Show image uploader
      setImageUploaderPosition({
        x: event.clientX,
        y: event.clientY,
        pageNumber
      })
      setShowImageUploader(true)
    } else {
      onPageClick?.(pageNumber, x, y)
    }
  }, [onPageClick, zoom, selectedTool])

  const handleTextSave = useCallback((text: string) => {
    if (text.trim() && onAddTextElement) {
      const pageElement = document?.pages.find(p => p.pageNumber === textEditorPosition.pageNumber)
      if (pageElement) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const relativeX = (textEditorPosition.x - rect.left) / (zoom / 100)
          const relativeY = (textEditorPosition.y - rect.top) / (zoom / 100)
          onAddTextElement(textEditorPosition.pageNumber, relativeX, relativeY, text)
        }
      }
    }
    setShowTextEditor(false)
  }, [textEditorPosition, onAddTextElement, document, zoom])

  const handleTextCancel = useCallback(() => {
    setShowTextEditor(false)
  }, [])

  const handleImageSelected = useCallback((src: string, width: number, height: number) => {
    if (onAddImageElement) {
      const pageElement = document?.pages.find(p => p.pageNumber === imageUploaderPosition.pageNumber)
      if (pageElement) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const relativeX = (imageUploaderPosition.x - rect.left) / (zoom / 100)
          const relativeY = (imageUploaderPosition.y - rect.top) / (zoom / 100)
          
          // Scale down large images
          const maxSize = 300
          let scaledWidth = width
          let scaledHeight = height
          
          if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height)
            scaledWidth = width * scale
            scaledHeight = height * scale
          }
          
          onAddImageElement(imageUploaderPosition.pageNumber, relativeX, relativeY, src, scaledWidth, scaledHeight)
        }
      }
    }
    setShowImageUploader(false)
  }, [imageUploaderPosition, onAddImageElement, document, zoom])

  const handleImageCancel = useCallback(() => {
    setShowImageUploader(false)
  }, [])

  const handleShapeComplete = useCallback((pageNumber: number, shape: Omit<ShapeElement, 'id' | 'pageNumber'>) => {
    if (onAddShapeElement) {
      onAddShapeElement(pageNumber, shape)
    }
  }, [onAddShapeElement])

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<PDFElement>) => {
    if (onUpdateElement) {
      onUpdateElement(elementId, updates)
    }
  }, [onUpdateElement])

  const handleElementDelete = useCallback((elementId: string) => {
    if (onDeleteElement) {
      onDeleteElement(elementId)
    }
  }, [onDeleteElement])

  const renderElement = useCallback((element: PDFElement, pageNumber: number) => {
    const isSelected = selectedElementIds.includes(element.id)
    const isHighlighted = highlightedElementId === element.id
    const scaledX = (element.x * zoom) / 100
    const scaledY = (element.y * zoom) / 100
    const scaledWidth = (element.width * zoom) / 100
    const scaledHeight = (element.height * zoom) / 100

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            className={`absolute cursor-pointer ${
              isSelected ? 'ring-2 ring-blue-500' : isHighlighted ? 'ring-2 ring-yellow-400 bg-yellow-100' : ''
            }`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              fontSize: `${(element.fontSize * zoom) / 100}px`,
              fontFamily: element.fontFamily,
              color: element.color,
              fontWeight: element.isBold ? 'bold' : 'normal',
              fontStyle: element.isItalic ? 'italic' : 'normal',
              textDecoration: element.isUnderline ? 'underline' : 'none',
              transform: `rotate(${element.rotation}deg)`,
              opacity: element.opacity,
              userSelect: 'none'
            }}
            onClick={() => onSelectElement?.(element.id)}
          >
            {element.text}
          </div>
        )
      
      case 'image':
        return (
          <img
            key={element.id}
            src={element.src}
            alt="PDF Image"
            className={`absolute cursor-pointer ${
              isSelected ? 'ring-2 ring-blue-500' : isHighlighted ? 'ring-2 ring-yellow-400' : ''
            }`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              transform: `rotate(${element.rotation}deg)`,
              opacity: element.opacity
            }}
            onClick={() => onSelectElement?.(element.id)}
            draggable={false}
          />
        )
      
      case 'shape':
        // TODO: Implement shape rendering
        return (
          <div
            key={element.id}
            className={`absolute border cursor-pointer ${
              isSelected ? 'ring-2 ring-blue-500' : isHighlighted ? 'ring-2 ring-yellow-400' : ''
            }`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              backgroundColor: element.fillColor || 'transparent',
              borderColor: element.strokeColor,
              borderWidth: `${element.strokeWidth}px`,
              borderRadius: element.shapeType === 'circle' ? '50%' : '0',
              transform: `rotate(${element.rotation}deg)`,
              opacity: element.opacity
            }}
            onClick={() => onSelectElement?.(element.id)}
          />
        )
      
      default:
        return null
    }
  }, [zoom, selectedElementIds, highlightedElementId, onSelectElement])

  const renderPage = useCallback(async (page: PDFPage): Promise<string> => {
    // Create a canvas for rendering
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    
    // Set canvas dimensions based on zoom
    const scaledWidth = (page.width * zoom) / 100
    const scaledHeight = (page.height * zoom) / 100
    
    canvas.width = scaledWidth
    canvas.height = scaledHeight
    
    // If we have existing content, use it
    if (page.content) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          context.drawImage(img, 0, 0, scaledWidth, scaledHeight)
          resolve(canvas.toDataURL())
        }
        img.src = page.content
      })
    }
    
    // Otherwise, render a placeholder
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, scaledWidth, scaledHeight)
    context.strokeStyle = '#e5e5e5'
    context.strokeRect(0, 0, scaledWidth, scaledHeight)
    
    // Add page number
    context.fillStyle = '#9ca3af'
    context.font = `${16 * (zoom / 100)}px Arial`
    context.textAlign = 'center'
    context.fillText(
      `Page ${page.pageNumber}`,
      scaledWidth / 2,
      scaledHeight / 2
    )
    
    return canvas.toDataURL()
  }, [zoom])

  // Re-render pages when zoom changes
  useEffect(() => {
    if (!document) return

    setIsRendering(true)
    const renderPromises = document.pages.map(async (page) => {
      const dataUrl = await renderPage(page)
      return [page.pageNumber, dataUrl] as [number, string]
    })

    Promise.all(renderPromises).then((results) => {
      const newPageMap = new Map(results)
      setRenderedPages(newPageMap)
      setIsRendering(false)
    })
  }, [document, zoom, renderPage])

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium mb-2">No document loaded</h3>
          <p className="text-sm">Open a PDF file to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="pdf-viewer h-full overflow-auto">
      {isRendering && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Rendering pages...</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center space-y-4 p-4">
        {document.pages.map((page) => {
          const renderedUrl = renderedPages.get(page.pageNumber)
          const scaledWidth = (page.width * zoom) / 100
          const scaledHeight = (page.height * zoom) / 100
          const pageElements = elements.filter(el => el.pageNumber === page.pageNumber)
          
          return (
            <div
              key={page.id}
              className="relative bg-white shadow-lg rounded-lg overflow-hidden"
              style={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`
              }}
            >
              {/* Page number indicator */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-20">
                Page {page.pageNumber}
              </div>
              
              {/* Page content */}
              {renderedUrl ? (
                <img
                  src={renderedUrl}
                  alt={`Page ${page.pageNumber}`}
                  className={`w-full h-full object-cover cursor-${selectedTool === 'select' ? 'default' : 'crosshair'}`}
                  onClick={(e) => handlePageClick(page.pageNumber, e)}
                  draggable={false}
                />
              ) : (
                <div 
                  className={`w-full h-full bg-gray-50 border border-gray-200 flex items-center justify-center cursor-${selectedTool === 'select' ? 'default' : 'crosshair'}`}
                  onClick={(e) => handlePageClick(page.pageNumber, e)}
                >
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">📄</div>
                    <div className="text-sm">Loading...</div>
                  </div>
                </div>
              )}
              
              {/* Elements overlay */}
              <div className="absolute inset-0 z-10">
                {pageElements.map(element => renderElement(element, page.pageNumber))}
              </div>
              
              {/* Element handles for selected elements */}
              {pageElements.filter(el => selectedElementIds.includes(el.id)).map(element => (
                <ElementHandles
                  key={`handles-${element.id}`}
                  element={element}
                  zoom={zoom}
                  onUpdate={(updates) => handleElementUpdate(element.id, updates)}
                  onDelete={() => handleElementDelete(element.id)}
                />
              ))}
              
              {/* Shape drawing overlay */}
              {selectedTool === 'shape' && (
                <ShapeDrawer
                  pageNumber={page.pageNumber}
                  zoom={zoom}
                  onShapeComplete={(shape) => handleShapeComplete(page.pageNumber, shape)}
                  shapeType="rectangle" // TODO: Make this configurable
                />
              )}
              
              {/* Tool overlay */}
              {selectedTool !== 'select' && selectedTool !== 'shape' && (
                <div 
                  className="absolute inset-0 bg-transparent hover:bg-blue-100 hover:bg-opacity-10 transition-colors z-15"
                  onClick={(e) => handlePageClick(page.pageNumber, e)}
                />
              )}
            </div>
          )
        })}
      </div>
      
      {/* Text Editor Modal */}
      {showTextEditor && (
        <TextEditor
          x={textEditorPosition.x}
          y={textEditorPosition.y}
          onSave={handleTextSave}
          onCancel={handleTextCancel}
        />
      )}
      
      {/* Image Uploader Modal */}
      {showImageUploader && (
        <ImageUploader
          x={imageUploaderPosition.x}
          y={imageUploaderPosition.y}
          onImageSelected={handleImageSelected}
          onCancel={handleImageCancel}
        />
      )}
    </div>
  )
}

export default PDFViewer