import { useState, useCallback } from 'react'
import { PDFDocument } from '../types'
import { loadPDFFromBytes, createNewPDF, exportPDFBytes } from '../utils/pdfUtils'

export const usePDF = () => {
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPDF = useCallback(async (bytes: Uint8Array, fileName: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const document = await loadPDFFromBytes(bytes)
      document.fileName = fileName
      setCurrentDocument(document)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF'
      setError(errorMessage)
      console.error('Error loading PDF:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createNew = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const document = await createNewPDF()
      setCurrentDocument(document)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create new PDF'
      setError(errorMessage)
      console.error('Error creating PDF:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const exportPDF = useCallback(async (): Promise<Uint8Array | null> => {
    if (!currentDocument) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      const bytes = await exportPDFBytes(currentDocument)
      return bytes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export PDF'
      setError(errorMessage)
      console.error('Error exporting PDF:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentDocument])

  const clearDocument = useCallback(() => {
    setCurrentDocument(null)
    setError(null)
  }, [])

  return {
    currentDocument,
    isLoading,
    error,
    loadPDF,
    createNew,
    exportPDF,
    clearDocument
  }
}