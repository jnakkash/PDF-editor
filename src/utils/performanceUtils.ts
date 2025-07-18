import { PDFDocument, PDFElement, PDFPage } from '../types'

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  elementCount: number
  pageCount: number
  lastUpdate: number
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private metrics: PerformanceMetrics
  private renderCache: Map<string, string> = new Map()
  private elementCache: Map<string, PDFElement[]> = new Map()
  private rafId: number | null = null

  constructor() {
    this.metrics = {
      renderTime: 0,
      memoryUsage: 0,
      elementCount: 0,
      pageCount: 0,
      lastUpdate: Date.now()
    }
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Debounced rendering to prevent excessive re-renders
  debounceRender(callback: () => void, delay: number = 16): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }
    
    this.rafId = requestAnimationFrame(() => {
      setTimeout(callback, delay)
    })
  }

  // Virtual scrolling for large documents
  calculateVisiblePages(
    pages: PDFPage[],
    containerHeight: number,
    scrollTop: number,
    pageHeight: number,
    buffer: number = 2
  ): { startIndex: number; endIndex: number; visiblePages: PDFPage[] } {
    const startIndex = Math.max(0, Math.floor(scrollTop / pageHeight) - buffer)
    const endIndex = Math.min(
      pages.length - 1,
      Math.floor((scrollTop + containerHeight) / pageHeight) + buffer
    )

    return {
      startIndex,
      endIndex,
      visiblePages: pages.slice(startIndex, endIndex + 1)
    }
  }

  // Lazy loading for page content
  shouldLoadPage(pageNumber: number, visiblePages: number[]): boolean {
    return visiblePages.includes(pageNumber)
  }

  // Element culling - only render visible elements
  cullElements(
    elements: PDFElement[],
    viewportBounds: { x: number; y: number; width: number; height: number },
    zoom: number
  ): PDFElement[] {
    const scaledBounds = {
      x: viewportBounds.x / (zoom / 100),
      y: viewportBounds.y / (zoom / 100),
      width: viewportBounds.width / (zoom / 100),
      height: viewportBounds.height / (zoom / 100)
    }

    return elements.filter(element => {
      // Check if element intersects with viewport
      return !(
        element.x + element.width < scaledBounds.x ||
        element.x > scaledBounds.x + scaledBounds.width ||
        element.y + element.height < scaledBounds.y ||
        element.y > scaledBounds.y + scaledBounds.height
      )
    })
  }

  // Memory management
  clearCache(): void {
    this.renderCache.clear()
    this.elementCache.clear()
  }

  // Cache management with size limits
  setCacheItem(key: string, value: string, maxSize: number = 50): void {
    if (this.renderCache.size >= maxSize) {
      const firstKey = this.renderCache.keys().next().value
      this.renderCache.delete(firstKey)
    }
    this.renderCache.set(key, value)
  }

  getCacheItem(key: string): string | undefined {
    return this.renderCache.get(key)
  }

  // Element indexing for fast lookups
  indexElements(elements: PDFElement[]): Map<number, PDFElement[]> {
    const pageIndex = new Map<number, PDFElement[]>()
    
    elements.forEach(element => {
      if (!pageIndex.has(element.pageNumber)) {
        pageIndex.set(element.pageNumber, [])
      }
      pageIndex.get(element.pageNumber)!.push(element)
    })

    return pageIndex
  }

  // Batch operations to reduce DOM manipulation
  batchDOMUpdates(updates: (() => void)[]): void {
    this.rafId = requestAnimationFrame(() => {
      updates.forEach(update => update())
    })
  }

  // Performance monitoring
  startPerformanceTracking(): () => void {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    return () => {
      const endTime = performance.now()
      this.metrics.renderTime = endTime - startTime
      this.metrics.memoryUsage = this.getMemoryUsage() - startMemory
      this.metrics.lastUpdate = Date.now()
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      // @ts-ignore - Chrome-specific API
      return (performance as any).memory?.usedJSHeapSize || 0
    }
    return 0
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Optimize images for faster rendering
  optimizeImageForCanvas(
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    quality: number = 0.8
  ): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Calculate optimal dimensions
    const scale = Math.min(targetWidth / img.width, targetHeight / img.height)
    canvas.width = img.width * scale
    canvas.height = img.height * scale

    // Use high-quality scaling
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    return canvas.toDataURL('image/jpeg', quality)
  }

  // Throttle expensive operations
  throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null
    let lastExecTime = 0

    return (...args: Parameters<T>) => {
      const currentTime = Date.now()

      if (currentTime - lastExecTime > delay) {
        func(...args)
        lastExecTime = currentTime
      } else {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func(...args)
          lastExecTime = Date.now()
        }, delay - (currentTime - lastExecTime))
      }
    }
  }

  // WebGL acceleration for complex operations (when available)
  isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    } catch (e) {
      return false
    }
  }

  // Optimize document structure for performance
  optimizeDocument(document: PDFDocument): PDFDocument {
    return {
      ...document,
      elements: this.optimizeElements(document.elements || []),
      pages: this.optimizePages(document.pages)
    }
  }

  private optimizeElements(elements: PDFElement[]): PDFElement[] {
    // Remove duplicate elements
    const uniqueElements = elements.filter((element, index, array) => {
      return !array.slice(0, index).some(existing => 
        existing.x === element.x &&
        existing.y === element.y &&
        existing.width === element.width &&
        existing.height === element.height &&
        existing.pageNumber === element.pageNumber &&
        this.elementsEqual(existing, element)
      )
    })

    // Sort elements by page and position for optimal rendering
    return uniqueElements.sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) {
        return a.pageNumber - b.pageNumber
      }
      if (a.y !== b.y) {
        return a.y - b.y
      }
      return a.x - b.x
    })
  }

  private optimizePages(pages: PDFPage[]): PDFPage[] {
    return pages.map(page => ({
      ...page,
      content: this.optimizePageContent(page.content)
    }))
  }

  private optimizePageContent(content: string): string {
    // If content is a data URL, try to optimize it
    if (content.startsWith('data:image/')) {
      // Could implement image compression here
      return content
    }
    return content
  }

  private elementsEqual(a: PDFElement, b: PDFElement): boolean {
    if (a.type !== b.type) return false
    
    switch (a.type) {
      case 'text':
        return (a as any).text === (b as any).text && (a as any).fontSize === (b as any).fontSize
      case 'image':
        return (a as any).src === (b as any).src
      case 'shape':
        return (a as any).shapeType === (b as any).shapeType
      case 'annotation':
        return (a as any).content === (b as any).content
      default:
        return false
    }
  }

  // Memory pressure detection and cleanup
  detectMemoryPressure(): boolean {
    if ('memory' in performance) {
      // @ts-ignore
      const memory = (performance as any).memory
      if (memory) {
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        return usageRatio > 0.8 // 80% memory usage threshold
      }
    }
    return false
  }

  handleMemoryPressure(): void {
    if (this.detectMemoryPressure()) {
      console.warn('High memory usage detected, clearing caches')
      this.clearCache()
      
      // Force garbage collection if available
      if ('gc' in window) {
        // @ts-ignore
        window.gc()
      }
    }
  }
}

// Custom hooks for performance optimization
export const usePerformanceOptimization = () => {
  const optimizer = PerformanceOptimizer.getInstance()
  
  return {
    debounceRender: optimizer.debounceRender.bind(optimizer),
    calculateVisiblePages: optimizer.calculateVisiblePages.bind(optimizer),
    cullElements: optimizer.cullElements.bind(optimizer),
    clearCache: optimizer.clearCache.bind(optimizer),
    getMetrics: optimizer.getMetrics.bind(optimizer),
    throttle: optimizer.throttle.bind(optimizer),
    optimizeDocument: optimizer.optimizeDocument.bind(optimizer),
    handleMemoryPressure: optimizer.handleMemoryPressure.bind(optimizer)
  }
}

export default PerformanceOptimizer