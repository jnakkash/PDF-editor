import { PDFDocument, PDFPage, PDFElement, TextElement, ImageElement, ShapeElement } from '../types'
import { ExportFormat, ExportOptions } from '../components/ExportDialog'

export class ExportManager {
  private document: PDFDocument
  private options: ExportOptions

  constructor(document: PDFDocument, options: ExportOptions) {
    this.document = document
    this.options = options
  }

  async exportToFormat(): Promise<Uint8Array | string> {
    switch (this.options.format) {
      case 'pdf':
        return this.exportToPDF()
      case 'png':
        return this.exportToImage('png')
      case 'jpg':
        return this.exportToImage('jpg')
      case 'svg':
        return this.exportToSVG()
      case 'html':
        return this.exportToHTML()
      case 'txt':
        return this.exportToText()
      default:
        throw new Error(`Unsupported export format: ${this.options.format}`)
    }
  }

  private async exportToPDF(): Promise<Uint8Array> {
    // This would use the existing PDF export functionality
    // For now, return placeholder
    throw new Error('PDF export should use the existing exportPDF function')
  }

  private async exportToImage(format: 'png' | 'jpg'): Promise<Uint8Array> {
    const { pageRange, dpi = 300, quality = 90, backgroundColor = '#ffffff', transparent = false } = this.options
    const pages = this.getFilteredPages()
    
    if (pages.length === 1) {
      // Single page export
      return this.renderPageToImage(pages[0], format, { dpi, quality, backgroundColor, transparent })
    } else {
      // Multiple pages - create a ZIP or combine into one image
      // For now, export the first page
      return this.renderPageToImage(pages[0], format, { dpi, quality, backgroundColor, transparent })
    }
  }

  private async renderPageToImage(
    page: PDFPage, 
    format: 'png' | 'jpg',
    options: { dpi: number; quality: number; backgroundColor: string; transparent: boolean }
  ): Promise<Uint8Array> {
    const { dpi, quality, backgroundColor, transparent } = options
    
    // Calculate dimensions based on DPI
    const scaleFactor = dpi / 72 // 72 is the base DPI
    const canvasWidth = page.width * scaleFactor
    const canvasHeight = page.height * scaleFactor

    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Set background
    if (!transparent || format === 'jpg') {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    // Render page content
    if (page.content) {
      await this.drawImageOnCanvas(ctx, page.content, canvasWidth, canvasHeight)
    }

    // Render elements if included
    await this.renderElementsOnCanvas(ctx, page.pageNumber, scaleFactor)

    // Convert to blob and return as Uint8Array
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'))
          return
        }
        
        const reader = new FileReader()
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer
          resolve(new Uint8Array(arrayBuffer))
        }
        reader.onerror = () => reject(new Error('Failed to read blob'))
        reader.readAsArrayBuffer(blob)
      }, `image/${format}`, format === 'jpg' ? quality / 100 : undefined)
    })
  }

  private async drawImageOnCanvas(ctx: CanvasRenderingContext2D, imageSrc: string, width: number, height: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        resolve()
      }
      img.onerror = () => reject(new Error('Failed to load page image'))
      img.src = imageSrc
    })
  }

  private async renderElementsOnCanvas(ctx: CanvasRenderingContext2D, pageNumber: number, scaleFactor: number): Promise<void> {
    const pageElements = this.document.elements.filter(el => el.pageNumber === pageNumber)

    for (const element of pageElements) {
      // Check if element type should be included
      if (element.type === 'text' && !this.options.includeText) continue
      if (element.type === 'image' && !this.options.includeImages) continue
      if (element.type === 'shape' && !this.options.includeShapes) continue

      await this.renderElementOnCanvas(ctx, element, scaleFactor)
    }
  }

  private async renderElementOnCanvas(ctx: CanvasRenderingContext2D, element: PDFElement, scaleFactor: number): Promise<void> {
    const x = element.x * scaleFactor
    const y = element.y * scaleFactor
    const width = element.width * scaleFactor
    const height = element.height * scaleFactor

    ctx.save()
    ctx.translate(x + width / 2, y + height / 2)
    ctx.rotate((element.rotation * Math.PI) / 180)
    ctx.globalAlpha = element.opacity

    switch (element.type) {
      case 'text':
        await this.renderTextElement(ctx, element as TextElement, width, height, scaleFactor)
        break
      case 'image':
        await this.renderImageElement(ctx, element as ImageElement, width, height)
        break
      case 'shape':
        await this.renderShapeElement(ctx, element as ShapeElement, width, height)
        break
    }

    ctx.restore()
  }

  private async renderTextElement(ctx: CanvasRenderingContext2D, element: TextElement, width: number, height: number, scaleFactor: number): Promise<void> {
    ctx.fillStyle = element.color || '#000000'
    ctx.font = `${element.isBold ? 'bold' : 'normal'} ${element.isItalic ? 'italic' : 'normal'} ${element.fontSize * scaleFactor}px ${element.fontFamily || 'Arial'}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    // Handle text decoration
    if (element.isUnderline) {
      const textWidth = ctx.measureText(element.text).width
      ctx.beginPath()
      ctx.moveTo(-width / 2, -height / 2 + element.fontSize * scaleFactor)
      ctx.lineTo(-width / 2 + textWidth, -height / 2 + element.fontSize * scaleFactor)
      ctx.strokeStyle = element.color || '#000000'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.fillText(element.text, -width / 2, -height / 2)
  }

  private async renderImageElement(ctx: CanvasRenderingContext2D, element: ImageElement, width: number, height: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, -width / 2, -height / 2, width, height)
        resolve()
      }
      img.onerror = () => {
        console.warn(`Failed to load image: ${element.src}`)
        // Draw placeholder rectangle
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(-width / 2, -height / 2, width, height)
        ctx.strokeStyle = '#ccc'
        ctx.strokeRect(-width / 2, -height / 2, width, height)
        resolve()
      }
      img.crossOrigin = 'anonymous'
      img.src = element.src
    })
  }

  private async renderShapeElement(ctx: CanvasRenderingContext2D, element: ShapeElement, width: number, height: number): Promise<void> {
    ctx.fillStyle = element.fillColor || 'transparent'
    ctx.strokeStyle = element.strokeColor || '#000000'
    ctx.lineWidth = element.strokeWidth || 1

    switch (element.shapeType) {
      case 'rectangle':
        if (element.fillColor) {
          ctx.fillRect(-width / 2, -height / 2, width, height)
        }
        if (element.strokeColor) {
          ctx.strokeRect(-width / 2, -height / 2, width, height)
        }
        break
      
      case 'circle':
        ctx.beginPath()
        ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, 2 * Math.PI)
        if (element.fillColor) {
          ctx.fill()
        }
        if (element.strokeColor) {
          ctx.stroke()
        }
        break
      
      case 'line':
        ctx.beginPath()
        ctx.moveTo(-width / 2, -height / 2)
        ctx.lineTo(width / 2, height / 2)
        ctx.stroke()
        break
    }
  }

  private async exportToSVG(): Promise<string> {
    const { pageRange, backgroundColor = '#ffffff' } = this.options
    const pages = this.getFilteredPages()

    if (pages.length === 1) {
      return this.renderPageToSVG(pages[0], backgroundColor)
    } else {
      // For multiple pages, create one SVG with multiple groups
      let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`

      let totalHeight = 0
      const maxWidth = Math.max(...pages.map(p => p.width))

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const pageContent = await this.renderPageToSVG(page, backgroundColor, `page-${i}`)
        // Extract content from page SVG and add with offset
        const contentMatch = pageContent.match(/<svg[^>]*>(.*)<\/svg>/s)
        if (contentMatch) {
          svgContent += `<g transform="translate(0, ${totalHeight})">${contentMatch[1]}</g>`
        }
        totalHeight += page.height + 20 // Add some spacing
      }

      svgContent += `</svg>`
      return svgContent
    }
  }

  private async renderPageToSVG(page: PDFPage, backgroundColor: string, id?: string): Promise<string> {
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg ${id ? `id="${id}"` : ''} width="${page.width}" height="${page.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>`

    // Add page background if it exists
    if (page.content) {
      svgContent += `<image href="${page.content}" width="${page.width}" height="${page.height}"/>`
    }

    // Render elements
    const pageElements = this.document.elements.filter(el => el.pageNumber === page.pageNumber)
    for (const element of pageElements) {
      if (element.type === 'text' && !this.options.includeText) continue
      if (element.type === 'image' && !this.options.includeImages) continue
      if (element.type === 'shape' && !this.options.includeShapes) continue

      svgContent += this.renderElementToSVG(element)
    }

    svgContent += '</svg>'
    return svgContent
  }

  private renderElementToSVG(element: PDFElement): string {
    const transform = `translate(${element.x}, ${element.y}) rotate(${element.rotation}) scale(1, 1)`
    
    switch (element.type) {
      case 'text':
        const textEl = element as TextElement
        return `<text x="0" y="0" transform="${transform}" 
          font-family="${textEl.fontFamily || 'Arial'}" 
          font-size="${textEl.fontSize}" 
          fill="${textEl.color || '#000000'}" 
          font-weight="${textEl.isBold ? 'bold' : 'normal'}"
          font-style="${textEl.isItalic ? 'italic' : 'normal'}"
          text-decoration="${textEl.isUnderline ? 'underline' : 'none'}"
          opacity="${textEl.opacity}">${textEl.text}</text>`
      
      case 'image':
        const imgEl = element as ImageElement
        return `<image x="0" y="0" width="${imgEl.width}" height="${imgEl.height}" 
          href="${imgEl.src}" transform="${transform}" opacity="${imgEl.opacity}"/>`
      
      case 'shape':
        const shapeEl = element as ShapeElement
        const fillColor = shapeEl.fillColor || 'none'
        const strokeColor = shapeEl.strokeColor || '#000000'
        const strokeWidth = shapeEl.strokeWidth || 1

        switch (shapeEl.shapeType) {
          case 'rectangle':
            return `<rect x="0" y="0" width="${shapeEl.width}" height="${shapeEl.height}" 
              fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"
              transform="${transform}" opacity="${shapeEl.opacity}"/>`
          
          case 'circle':
            return `<ellipse cx="${shapeEl.width / 2}" cy="${shapeEl.height / 2}" 
              rx="${shapeEl.width / 2}" ry="${shapeEl.height / 2}"
              fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"
              transform="${transform}" opacity="${shapeEl.opacity}"/>`
          
          case 'line':
            return `<line x1="0" y1="0" x2="${shapeEl.width}" y2="${shapeEl.height}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"
              transform="${transform}" opacity="${shapeEl.opacity}"/>`
        }
        break
    }
    return ''
  }

  private async exportToHTML(): Promise<string> {
    const { backgroundColor = '#ffffff' } = this.options
    const pages = this.getFilteredPages()

    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.document.fileName || 'Document'}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: ${backgroundColor};
        }
        .page {
            position: relative;
            margin: 20px auto;
            border: 1px solid #ccc;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            background: white;
        }
        .element {
            position: absolute;
        }
        .text-element {
            white-space: pre-wrap;
        }
        .image-element {
            max-width: 100%;
        }
        .shape-element {
            border: 1px solid #000;
        }
    </style>
</head>
<body>`

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      htmlContent += `<div class="page" style="width: ${page.width}px; height: ${page.height}px;">`
      
      // Add page background
      if (page.content) {
        htmlContent += `<img src="${page.content}" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 0;" alt="Page ${i + 1}"/>`
      }

      // Add elements
      const pageElements = this.document.elements.filter(el => el.pageNumber === page.pageNumber)
      for (const element of pageElements) {
        if (element.type === 'text' && !this.options.includeText) continue
        if (element.type === 'image' && !this.options.includeImages) continue
        if (element.type === 'shape' && !this.options.includeShapes) continue

        htmlContent += this.renderElementToHTML(element)
      }

      htmlContent += '</div>'
    }

    htmlContent += `</body>
</html>`
    return htmlContent
  }

  private renderElementToHTML(element: PDFElement): string {
    const baseStyle = `
      left: ${element.x}px;
      top: ${element.y}px;
      width: ${element.width}px;
      height: ${element.height}px;
      transform: rotate(${element.rotation}deg);
      opacity: ${element.opacity};
    `

    switch (element.type) {
      case 'text':
        const textEl = element as TextElement
        return `<div class="element text-element" style="${baseStyle}
          color: ${textEl.color || '#000000'};
          font-family: ${textEl.fontFamily || 'Arial'};
          font-size: ${textEl.fontSize}px;
          font-weight: ${textEl.isBold ? 'bold' : 'normal'};
          font-style: ${textEl.isItalic ? 'italic' : 'normal'};
          text-decoration: ${textEl.isUnderline ? 'underline' : 'none'};
        ">${textEl.text}</div>`
      
      case 'image':
        const imgEl = element as ImageElement
        return `<img class="element image-element" src="${imgEl.src}" style="${baseStyle}" alt="Image element"/>`
      
      case 'shape':
        const shapeEl = element as ShapeElement
        const shapeStyle = `${baseStyle}
          background-color: ${shapeEl.fillColor || 'transparent'};
          border: ${shapeEl.strokeWidth || 1}px solid ${shapeEl.strokeColor || '#000000'};
          ${shapeEl.shapeType === 'circle' ? 'border-radius: 50%;' : ''}
        `
        return `<div class="element shape-element" style="${shapeStyle}"></div>`
    }
    return ''
  }

  private async exportToText(): Promise<string> {
    const pages = this.getFilteredPages()
    let textContent = ''

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      textContent += `=== Page ${page.pageNumber} ===\n\n`

      // Get text elements for this page
      const textElements = this.document.elements
        .filter(el => el.pageNumber === page.pageNumber && el.type === 'text')
        .sort((a, b) => a.y - b.y) // Sort by vertical position

      for (const element of textElements as TextElement[]) {
        if (this.options.includeText !== false) {
          textContent += element.text + '\n'
        }
      }

      textContent += '\n'
    }

    return textContent
  }

  private getFilteredPages(): PDFPage[] {
    const { pageRange } = this.options
    if (!pageRange) return this.document.pages

    return this.document.pages.filter(page => 
      page.pageNumber >= pageRange.from && page.pageNumber <= pageRange.to
    )
  }
}

export async function exportDocument(document: PDFDocument, options: ExportOptions): Promise<Uint8Array | string> {
  const manager = new ExportManager(document, options)
  return manager.exportToFormat()
}