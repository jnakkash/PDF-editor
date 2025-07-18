export interface PDFDocument {
  id: string
  fileName: string
  pages: PDFPage[]
  metadata: PDFMetadata
  elements?: PDFElement[]
}

export * from './elements'

export interface PDFPage {
  id: string
  pageNumber: number
  width: number
  height: number
  rotation: number
  content: string // Base64 encoded page content
}

export interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
}

export interface Tool {
  id: string
  name: string
  icon: string
  active: boolean
}

export interface ViewSettings {
  zoom: number
  fitToWidth: boolean
  fitToHeight: boolean
  showGrid: boolean
  showRuler: boolean
}