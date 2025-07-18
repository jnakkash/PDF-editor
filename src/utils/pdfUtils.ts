import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, PDFPage } from 'pdf-lib'
import { PDFDocument as PDFDocumentType, PDFPage as PDFPageType } from '../types'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export const loadPDFFromBytes = async (bytes: Uint8Array): Promise<PDFDocumentType> => {
  try {
    // Load with PDF.js for rendering
    const loadingTask = pdfjsLib.getDocument({ data: bytes })
    const pdfDoc = await loadingTask.promise
    
    // Load with PDF-lib for editing
    const pdfLibDoc = await PDFDocument.load(bytes)
    
    const pages: PDFPageType[] = []
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const viewport = page.getViewport({ scale: 1.0 })
      
      // Render page to canvas to get image data
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
      
      // Convert canvas to base64
      const content = canvas.toDataURL('image/png')
      
      pages.push({
        id: `page-${i}`,
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        rotation: 0,
        content: content
      })
    }
    
    const document: PDFDocumentType = {
      id: Date.now().toString(),
      fileName: 'document.pdf',
      pages: pages,
      metadata: {
        title: pdfLibDoc.getTitle() || undefined,
        author: pdfLibDoc.getAuthor() || undefined,
        subject: pdfLibDoc.getSubject() || undefined,
        creator: pdfLibDoc.getCreator() || undefined,
        producer: pdfLibDoc.getProducer() || undefined,
        creationDate: pdfLibDoc.getCreationDate() || undefined,
        modificationDate: pdfLibDoc.getModificationDate() || undefined
      }
    }
    
    return document
  } catch (error) {
    console.error('Error loading PDF:', error)
    throw new Error(`Failed to load PDF: ${error}`)
  }
}

export const createNewPDF = async (): Promise<PDFDocumentType> => {
  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Standard letter size
    
    const document: PDFDocumentType = {
      id: Date.now().toString(),
      fileName: 'new-document.pdf',
      pages: [{
        id: 'page-1',
        pageNumber: 1,
        width: 612,
        height: 792,
        rotation: 0,
        content: '' // Empty page
      }],
      metadata: {
        title: 'New Document',
        creator: 'PDF Editor',
        creationDate: new Date(),
        modificationDate: new Date()
      }
    }
    
    return document
  } catch (error) {
    console.error('Error creating PDF:', error)
    throw new Error(`Failed to create PDF: ${error}`)
  }
}

export const exportPDFBytes = async (document: PDFDocumentType): Promise<Uint8Array> => {
  try {
    const pdfDoc = await PDFDocument.create()
    
    // Add pages to new document
    for (const pageData of document.pages) {
      const page = pdfDoc.addPage([pageData.width, pageData.height])
      
      // TODO: Add actual content to pages
      // For now, just create empty pages with correct dimensions
    }
    
    // Set metadata
    if (document.metadata.title) pdfDoc.setTitle(document.metadata.title)
    if (document.metadata.author) pdfDoc.setAuthor(document.metadata.author)
    if (document.metadata.subject) pdfDoc.setSubject(document.metadata.subject)
    if (document.metadata.creator) pdfDoc.setCreator(document.metadata.creator)
    if (document.metadata.creationDate) pdfDoc.setCreationDate(document.metadata.creationDate)
    if (document.metadata.modificationDate) pdfDoc.setModificationDate(document.metadata.modificationDate)
    
    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw new Error(`Failed to export PDF: ${error}`)
  }
}