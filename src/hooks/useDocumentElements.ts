import { useState, useCallback } from 'react'
import { PDFElement, TextElement, ImageElement, ShapeElement } from '../types/elements'

export const useDocumentElements = () => {
  const [elements, setElements] = useState<PDFElement[]>([])
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([])
  const [history, setHistory] = useState<PDFElement[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  const addElement = useCallback((element: PDFElement) => {
    setElements(prev => {
      const newElements = [...prev, element]
      
      // Update history
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1)
        newHistory.push([...newElements])
        return newHistory
      })
      setHistoryIndex(prev => prev + 1)
      
      return newElements
    })
  }, [historyIndex])

  const updateElement = useCallback((id: string, updates: Partial<PDFElement>) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
      
      // Update history
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1)
        newHistory.push([...newElements])
        return newHistory
      })
      setHistoryIndex(prev => prev + 1)
      
      return newElements
    })
  }, [historyIndex])

  const removeElement = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id)
      
      // Update history
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1)
        newHistory.push([...newElements])
        return newHistory
      })
      setHistoryIndex(prev => prev + 1)
      
      return newElements
    })
    
    // Remove from selection if selected
    setSelectedElementIds(prev => prev.filter(selectedId => selectedId !== id))
  }, [historyIndex])

  const selectElement = useCallback((id: string, addToSelection = false) => {
    setSelectedElementIds(prev => {
      if (addToSelection) {
        return prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
      } else {
        return [id]
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedElementIds([])
  }, [])

  const getElementsByPage = useCallback((pageNumber: number) => {
    return elements.filter(el => el.pageNumber === pageNumber)
  }, [elements])

  const getSelectedElements = useCallback(() => {
    return elements.filter(el => selectedElementIds.includes(el.id))
  }, [elements, selectedElementIds])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevElements = history[historyIndex - 1]
      setElements(prevElements)
      setHistoryIndex(prev => prev - 1)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextElements = history[historyIndex + 1]
      setElements(nextElements)
      setHistoryIndex(prev => prev + 1)
    }
  }, [history, historyIndex])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const createTextElement = useCallback((
    pageNumber: number,
    x: number,
    y: number,
    text: string,
    options: Partial<TextElement> = {}
  ): TextElement => {
    return {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      pageNumber,
      x,
      y,
      width: text.length * (options.fontSize || 16) * 0.6, // Rough width calculation
      height: options.fontSize || 16,
      text,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      rotation: 0,
      opacity: 1,
      ...options
    }
  }, [])

  const createImageElement = useCallback((
    pageNumber: number,
    x: number,
    y: number,
    src: string,
    width: number,
    height: number,
    options: Partial<ImageElement> = {}
  ): ImageElement => {
    return {
      id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'image',
      pageNumber,
      x,
      y,
      width,
      height,
      src,
      rotation: 0,
      opacity: 1,
      ...options
    }
  }, [])

  const addTextElement = useCallback((pageNumber: number, x: number, y: number, text: string, options: Partial<TextElement> = {}) => {
    const element = createTextElement(pageNumber, x, y, text, options)
    addElement(element)
    return element.id
  }, [addElement, createTextElement])

  const addImageElement = useCallback((pageNumber: number, x: number, y: number, src: string, width: number, height: number, options: Partial<ImageElement> = {}) => {
    const element = createImageElement(pageNumber, x, y, src, width, height, options)
    addElement(element)
    return element.id
  }, [addElement, createImageElement])

  const addShapeElement = useCallback((pageNumber: number, x: number, y: number, width: number, height: number, shapeType: ShapeElement['shapeType'], options: Partial<ShapeElement> = {}) => {
    const element = createShapeElement(pageNumber, x, y, width, height, shapeType, options)
    addElement(element)
    return element.id
  }, [addElement, createShapeElement])

  const createShapeElement = useCallback((
    pageNumber: number,
    x: number,
    y: number,
    width: number,
    height: number,
    shapeType: ShapeElement['shapeType'],
    options: Partial<ShapeElement> = {}
  ): ShapeElement => {
    return {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'shape',
      pageNumber,
      x,
      y,
      width,
      height,
      shapeType,
      strokeColor: '#000000',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      ...options
    }
  }, [])

  return {
    elements,
    selectedElementIds,
    addElement,
    updateElement,
    removeElement,
    selectElement,
    clearSelection,
    getElementsByPage,
    getSelectedElements,
    undo,
    redo,
    canUndo,
    canRedo,
    createTextElement,
    createImageElement,
    createShapeElement,
    addTextElement,
    addImageElement,
    addShapeElement
  }
}