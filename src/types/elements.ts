export interface TextElement {
  id: string
  type: 'text'
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
  fontFamily: string
  color: string
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  rotation: number
  opacity: number
}

export interface ImageElement {
  id: string
  type: 'image'
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  src: string
  rotation: number
  opacity: number
}

export interface ShapeElement {
  id: string
  type: 'shape'
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  shapeType: 'rectangle' | 'circle' | 'line' | 'arrow'
  fillColor?: string
  strokeColor: string
  strokeWidth: number
  rotation: number
  opacity: number
}

export interface AnnotationElement {
  id: string
  type: 'annotation'
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  annotationType: 'highlight' | 'note' | 'stamp' | 'freehand' | 'callout' | 'arrow'
  content: string
  color: string
  author: string
  createdAt: Date
  modifiedAt: Date
  opacity: number
  rotation: number
  // Specific properties for different annotation types
  strokeWidth?: number
  strokeColor?: string
  fillColor?: string
  // For freehand annotations
  points?: Array<{ x: number; y: number }>
  // For callouts and arrows
  targetX?: number
  targetY?: number
  // For stamps
  stampType?: 'approved' | 'rejected' | 'draft' | 'confidential' | 'custom'
  customStampText?: string
}

export interface Comment {
  id: string
  parentId?: string // For threaded replies
  elementId?: string // Associated with specific element
  pageNumber: number
  x: number
  y: number
  content: string
  author: string
  createdAt: Date
  modifiedAt: Date
  resolved: boolean
  replies?: Comment[]
}

export type PDFElement = TextElement | ImageElement | ShapeElement | AnnotationElement

export interface ElementLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  elements: PDFElement[]
}