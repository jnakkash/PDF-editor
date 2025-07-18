import React, { useState } from 'react'
import { PDFDocument } from '../types'
import PDFViewer from './PDFViewer'
import { useDocumentElements } from '../hooks/useDocumentElements'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useClipboard } from '../hooks/useClipboard'

interface MainCanvasProps {
  currentDocument: PDFDocument | null
  isLoading: boolean
  highlightedElementId?: string | null
}

const MainCanvas: React.FC<MainCanvasProps> = ({ currentDocument, isLoading, highlightedElementId }) => {
  const [zoom, setZoom] = useState(100)
  const [selectedTool, setSelectedTool] = useState<string>('select')
  
  const {
    elements,
    selectedElementIds,
    addElement,
    updateElement,
    removeElement,
    selectElement,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    createTextElement,
    createImageElement,
    createShapeElement,
    addTextElement,
    addImageElement,
    addShapeElement,
    getSelectedElements
  } = useDocumentElements()

  const {
    copyElements,
    pasteElements,
    hasClipboardData,
    getClipboardInfo
  } = useClipboard()

  const tools = [
    { id: 'select', name: 'Select', icon: '↖' },
    { id: 'text', name: 'Text', icon: 'T' },
    { id: 'image', name: 'Image', icon: '🖼' },
    { id: 'shape', name: 'Shape', icon: '◯' },
    { id: 'pen', name: 'Pen', icon: '✏️' },
    { id: 'highlighter', name: 'Highlight', icon: '🖍' }
  ]

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 500))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25))
  const handleZoomFit = () => setZoom(100)
  
  const handlePageClick = (pageNumber: number, x: number, y: number) => {
    console.log(`Clicked on page ${pageNumber} at (${x.toFixed(2)}, ${y.toFixed(2)})`)
    
    // Clear selection when clicking on empty space
    if (selectedTool === 'select') {
      clearSelection()
    }
  }

  const handleAddTextElement = (pageNumber: number, x: number, y: number, text: string) => {
    addTextElement(pageNumber, x, y, text)
  }

  const handleAddImageElement = (pageNumber: number, x: number, y: number, src: string, width: number, height: number) => {
    addImageElement(pageNumber, x, y, src, width, height)
  }

  const handleAddShapeElement = (pageNumber: number, shape: any) => {
    addShapeElement(pageNumber, shape.x, shape.y, shape.width, shape.height, shape.shapeType, shape)
  }

  const handleUpdateElement = (elementId: string, updates: any) => {
    updateElement(elementId, updates)
  }

  const handleDeleteElement = (elementId: string) => {
    removeElement(elementId)
  }

  const handleSelectElement = (elementId: string) => {
    selectElement(elementId)
  }

  const handleToolChange = (toolId: string) => {
    setSelectedTool(toolId)
    if (toolId !== 'select') {
      clearSelection()
    }
  }

  const handleSelectAll = () => {
    // Select all elements on the current page
    // For now, just select all elements
    elements.forEach(element => {
      selectElement(element.id, true)
    })
  }

  const handleDelete = () => {
    selectedElementIds.forEach(id => {
      removeElement(id)
    })
  }

  const handleCopy = () => {
    const selectedElements = getSelectedElements()
    if (selectedElements.length > 0) {
      copyElements(selectedElements)
      console.log(`Copied ${selectedElements.length} elements`)
    }
  }

  const handlePaste = () => {
    if (!hasClipboardData()) {
      console.log('No clipboard data available')
      return
    }

    // Paste to the first page for now (TODO: paste to current page)
    const targetPageNumber = currentDocument?.pages[0]?.pageNumber || 1
    const pastedElementsData = pasteElements(targetPageNumber)
    
    // Add pasted elements to the document
    pastedElementsData.forEach(elementData => {
      addElement(elementData)
    })

    // Select the newly pasted elements
    clearSelection()
    pastedElementsData.forEach(elementData => {
      selectElement(elementData.id, true)
    })

    console.log(`Pasted ${pastedElementsData.length} elements`)
  }

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onSelectAll: handleSelectAll,
    onDelete: handleDelete,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomFit: handleZoomFit,
    canUndo,
    canRedo
  })

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolChange(tool.id)}
              className={`p-2 rounded text-sm font-medium transition-colors ${
                selectedTool === tool.id
                  ? 'bg-blue-100 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={tool.name}
            >
              <span className="text-lg">{tool.icon}</span>
            </button>
          ))}
          
          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            disabled={zoom <= 25}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
          </button>
          
          <button
            onClick={handleZoomFit}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded min-w-16"
          >
            {zoom}%
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            disabled={zoom >= 500}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        ) : (
          <PDFViewer
            document={currentDocument}
            zoom={zoom}
            selectedTool={selectedTool}
            elements={elements}
            selectedElementIds={selectedElementIds}
            highlightedElementId={highlightedElementId}
            onPageClick={handlePageClick}
            onAddTextElement={handleAddTextElement}
            onAddImageElement={handleAddImageElement}
            onAddShapeElement={handleAddShapeElement}
            onSelectElement={handleSelectElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          {currentDocument && (
            <>
              <span>Pages: {currentDocument.pages.length}</span>
              <span>•</span>
              <span>Elements: {elements.length}</span>
              <span>•</span>
              <span>Tool: {tools.find(t => t.id === selectedTool)?.name}</span>
              {selectedElementIds.length > 0 && (
                <>
                  <span>•</span>
                  <span>Selected: {selectedElementIds.length}</span>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Zoom: {zoom}%</span>
        </div>
      </div>
    </div>
  )
}

export default MainCanvas