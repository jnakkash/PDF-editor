import { useState, useCallback } from 'react'
import { PDFElement } from '../types'

interface ClipboardData {
  elements: PDFElement[]
  timestamp: number
}

export const useClipboard = () => {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null)

  const copyElements = useCallback((elements: PDFElement[]) => {
    if (elements.length === 0) return

    // Create deep copies of elements without IDs (they'll get new ones when pasted)
    const elementsCopy = elements.map(element => {
      const { id, ...elementData } = element
      return {
        ...elementData,
        // Remove ID so new ones will be generated on paste
        id: ''
      } as PDFElement
    })

    setClipboard({
      elements: elementsCopy,
      timestamp: Date.now()
    })

    // Also copy to system clipboard as JSON (for debugging/advanced users)
    try {
      navigator.clipboard.writeText(JSON.stringify(elementsCopy, null, 2))
    } catch (error) {
      console.warn('Failed to copy to system clipboard:', error)
    }
  }, [])

  const pasteElements = useCallback((targetPageNumber?: number, offsetX = 10, offsetY = 10) => {
    if (!clipboard) return []

    const now = Date.now()
    // Elements older than 5 minutes are considered stale
    if (now - clipboard.timestamp > 5 * 60 * 1000) {
      setClipboard(null)
      return []
    }

    // Create new elements with new IDs and optional offset
    const pastedElements = clipboard.elements.map((element, index) => {
      const newId = `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const offset = index * 5 // Slight cascade offset for multiple elements
      
      return {
        ...element,
        id: newId,
        pageNumber: targetPageNumber ?? element.pageNumber,
        x: element.x + offsetX + offset,
        y: element.y + offsetY + offset
      } as PDFElement
    })

    return pastedElements
  }, [clipboard])

  const hasClipboardData = useCallback(() => {
    if (!clipboard) return false
    
    const now = Date.now()
    return now - clipboard.timestamp <= 5 * 60 * 1000 // 5 minutes
  }, [clipboard])

  const clearClipboard = useCallback(() => {
    setClipboard(null)
  }, [])

  const getClipboardInfo = useCallback(() => {
    if (!clipboard || !hasClipboardData()) return null

    return {
      elementCount: clipboard.elements.length,
      types: [...new Set(clipboard.elements.map(el => el.type))],
      age: Date.now() - clipboard.timestamp
    }
  }, [clipboard, hasClipboardData])

  return {
    copyElements,
    pasteElements,
    hasClipboardData,
    clearClipboard,
    getClipboardInfo
  }
}