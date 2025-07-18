import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MainCanvas from './components/MainCanvas'
import SearchPanel from './components/SearchPanel'
import MetadataEditor from './components/MetadataEditor'
import ExportDialog, { ExportFormat, ExportOptions } from './components/ExportDialog'
import AnnotationPanel from './components/AnnotationPanel'
import PerformanceMonitor from './components/PerformanceMonitor'
import { usePDF } from './hooks/usePDF'
import { ElementLayer, PDFElement, AnnotationElement, Comment } from './types'
import { exportDocument } from './utils/exportUtils'
import { usePerformanceOptimization } from './utils/performanceUtils'

const App: React.FC = () => {
  const { currentDocument, isLoading, error, loadPDF, createNew, exportPDF, clearDocument } = usePDF()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null)
  
  // Layer management
  const [layers, setLayers] = useState<ElementLayer[]>([
    { id: 'default', name: 'Default Layer', visible: true, locked: false, elements: [] }
  ])
  
  // Annotation and comment management
  const [annotations, setAnnotations] = useState<AnnotationElement[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [currentUser] = useState('User') // TODO: Get from auth system
  
  // Performance monitoring
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  const { optimizeDocument, handleMemoryPressure } = usePerformanceOptimization()

  useEffect(() => {
    // Listen for menu actions from Electron
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((action: string) => {
        switch (action) {
          case 'new-file':
            handleNewFile()
            break
          case 'open-file':
            handleOpenFile()
            break
          case 'save-file':
            handleSaveFile()
            break
          case 'save-as-file':
            handleSaveAsFile()
            break
        }
      })
    }
  }, [])

  // Performance monitoring and optimization
  useEffect(() => {
    const handleDocumentOptimization = () => {
      if (currentDocument) {
        const optimized = optimizeDocument(currentDocument)
        // Apply optimizations if needed
      }
    }

    const handleMemoryCheck = () => {
      handleMemoryPressure()
    }

    // Run optimization checks periodically
    const optimizationInterval = setInterval(handleDocumentOptimization, 30000) // 30 seconds
    const memoryInterval = setInterval(handleMemoryCheck, 10000) // 10 seconds

    return () => {
      clearInterval(optimizationInterval)
      clearInterval(memoryInterval)
    }
  }, [currentDocument, optimizeDocument, handleMemoryPressure])

  // Global keyboard shortcuts for performance monitoring
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle performance monitor with Ctrl+Shift+P
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault()
        setShowPerformanceMonitor(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleNewFile = async () => {
    await createNew()
  }

  const handleOpenFile = async () => {
    if (!window.electronAPI) return
    
    try {
      const result = await window.electronAPI.openFileDialog()
      if (result.success && result.data && result.fileName) {
        const bytes = new Uint8Array(result.data)
        await loadPDF(bytes, result.fileName)
      }
    } catch (error) {
      console.error('Error opening file:', error)
    }
  }

  const handleSaveFile = async () => {
    if (!currentDocument || !window.electronAPI) return
    
    try {
      const pdfBytes = await exportPDF()
      if (pdfBytes) {
        const result = await window.electronAPI.saveFileDialog(pdfBytes, currentDocument.fileName)
        if (result.success) {
          console.log('File saved successfully')
        }
      }
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  const handleSaveAsFile = async () => {
    if (!currentDocument || !window.electronAPI) return
    
    try {
      const pdfBytes = await exportPDF()
      if (pdfBytes) {
        const result = await window.electronAPI.saveFileDialog(pdfBytes, 'document.pdf')
        if (result.success) {
          console.log('File saved successfully')
        }
      }
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  // Layer management handlers
  const handleUpdateLayer = (layerId: string, updates: Partial<ElementLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ))
  }

  const handleCreateLayer = (name: string) => {
    const newLayer: ElementLayer = {
      id: `layer-${Date.now()}`,
      name,
      visible: true,
      locked: false,
      elements: []
    }
    setLayers(prev => [...prev, newLayer])
  }

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length > 1) {
      setLayers(prev => prev.filter(layer => layer.id !== layerId))
    }
  }

  const handleMoveElementToLayer = (elementId: string, layerId: string) => {
    // TODO: Implement element-to-layer association
    console.log(`Moving element ${elementId} to layer ${layerId}`)
  }

  const handleReorderLayers = (layerIds: string[]) => {
    const reorderedLayers = layerIds.map(id => layers.find(layer => layer.id === id)!).filter(Boolean)
    setLayers(reorderedLayers)
  }

  // Search and export handlers
  const handleShowSearch = () => setShowSearch(true)
  const handleShowMetadata = () => setShowMetadata(true)
  const handleShowExport = () => setShowExport(true)
  const handleShowAnnotations = () => setShowAnnotations(true)

  const handleHighlightElement = (elementId: string) => {
    setHighlightedElementId(elementId)
    setTimeout(() => setHighlightedElementId(null), 2000) // Clear highlight after 2 seconds
  }

  const handleMetadataUpdate = (metadata: any) => {
    if (currentDocument) {
      // TODO: Update document metadata
      console.log('Updating metadata:', metadata)
    }
  }

  // Annotation handlers
  const handleCreateAnnotation = (annotation: Omit<AnnotationElement, 'id'>) => {
    const newAnnotation: AnnotationElement = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setAnnotations(prev => [...prev, newAnnotation])
  }

  const handleUpdateAnnotation = (id: string, updates: Partial<AnnotationElement>) => {
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === id ? { ...annotation, ...updates } : annotation
    ))
  }

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(annotation => annotation.id !== id))
  }

  // Comment handlers
  const handleCreateComment = (comment: Omit<Comment, 'id'>) => {
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    if (comment.parentId) {
      // This is a reply, add to parent's replies
      setComments(prev => prev.map(c => {
        if (c.id === comment.parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newComment]
          }
        }
        return c
      }))
    } else {
      // This is a top-level comment
      setComments(prev => [...prev, newComment])
    }
  }

  const handleUpdateComment = (id: string, updates: Partial<Comment>) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === id) {
        return { ...comment, ...updates }
      }
      // Check replies
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply => 
            reply.id === id ? { ...reply, ...updates } : reply
          )
        }
      }
      return comment
    }))
  }

  const handleDeleteComment = (id: string) => {
    setComments(prev => prev.filter(comment => {
      if (comment.id === id) return false
      if (comment.replies) {
        comment.replies = comment.replies.filter(reply => reply.id !== id)
      }
      return true
    }))
  }

  const handleExport = async (format: ExportFormat, options: ExportOptions) => {
    if (!currentDocument) return

    try {
      console.log(`Exporting as ${format} with options:`, options)
      
      let fileName = `${currentDocument.fileName || 'document'}.${format}`
      
      switch (format) {
        case 'pdf':
          // Use existing PDF export functionality
          const pdfBytes = await exportPDF()
          if (pdfBytes && window.electronAPI) {
            await window.electronAPI.saveFileDialog(pdfBytes, fileName)
          }
          break
        
        case 'png':
        case 'jpg':
        case 'svg':
        case 'html':
        case 'txt':
          // Use new export utility
          const exportedData = await exportDocument(currentDocument, options)
          
          if (window.electronAPI) {
            if (typeof exportedData === 'string') {
              // Text-based formats (SVG, HTML, TXT)
              const textData = new TextEncoder().encode(exportedData)
              await window.electronAPI.saveFileDialog(textData, fileName)
            } else {
              // Binary formats (PNG, JPG)
              await window.electronAPI.saveFileDialog(exportedData, fileName)
            }
          } else {
            // Fallback for web environment - trigger download
            const blob = typeof exportedData === 'string' 
              ? new Blob([exportedData], { type: `text/${format === 'html' ? 'html' : 'plain'}` })
              : new Blob([exportedData], { type: `image/${format}` })
            
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
          break
      }
      
      console.log(`Successfully exported as ${format}`)
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header 
        currentDocument={currentDocument}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onSearch={handleShowSearch}
        onExport={handleShowExport}
        onShowMetadata={handleShowMetadata}
        onShowAnnotations={handleShowAnnotations}
        isLoading={isLoading}
      />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => clearDocument()}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentDocument={currentDocument}
          layers={layers}
          onUpdateLayer={handleUpdateLayer}
          onCreateLayer={handleCreateLayer}
          onDeleteLayer={handleDeleteLayer}
          onMoveElementToLayer={handleMoveElementToLayer}
          onReorderLayers={handleReorderLayers}
        />
        
        <MainCanvas 
          currentDocument={currentDocument}
          isLoading={isLoading}
          highlightedElementId={highlightedElementId}
        />
      </div>
      
      {/* Modal Components */}
      {showSearch && currentDocument && (
        <SearchPanel
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          document={currentDocument}
          onHighlightElement={handleHighlightElement}
        />
      )}
      
      {showMetadata && currentDocument && (
        <MetadataEditor
          isOpen={showMetadata}
          onClose={() => setShowMetadata(false)}
          document={currentDocument}
          onUpdate={handleMetadataUpdate}
        />
      )}
      
      {showExport && currentDocument && (
        <ExportDialog
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          document={currentDocument}
          onExport={handleExport}
        />
      )}

      {showAnnotations && currentDocument && (
        <AnnotationPanel
          isOpen={showAnnotations}
          onClose={() => setShowAnnotations(false)}
          document={currentDocument}
          annotations={annotations}
          comments={comments}
          onCreateAnnotation={handleCreateAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onCreateComment={handleCreateComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          onHighlightAnnotation={handleHighlightElement}
          currentUser={currentUser}
        />
      )}

      {/* Performance Monitor */}
      <PerformanceMonitor
        isEnabled={showPerformanceMonitor}
        onToggle={setShowPerformanceMonitor}
      />
    </div>
  )
}

export default App