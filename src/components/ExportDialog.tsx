import React, { useState } from 'react'
import { PDFDocument } from '../types'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  document: PDFDocument
  onExport: (format: ExportFormat, options: ExportOptions) => Promise<void>
}

export type ExportFormat = 'pdf' | 'png' | 'jpg' | 'svg' | 'html' | 'txt'

export interface ExportOptions {
  format: ExportFormat
  quality?: number
  dpi?: number
  includeImages?: boolean
  includeText?: boolean
  includeShapes?: boolean
  pageRange?: {
    from: number
    to: number
  }
  backgroundColor?: string
  transparent?: boolean
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  document,
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [quality, setQuality] = useState(90)
  const [dpi, setDpi] = useState(300)
  const [includeImages, setIncludeImages] = useState(true)
  const [includeText, setIncludeText] = useState(true)
  const [includeShapes, setIncludeShapes] = useState(true)
  const [pageFrom, setPageFrom] = useState(1)
  const [pageTo, setPageTo] = useState(document?.pages.length || 1)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [transparent, setTransparent] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const exportFormats = [
    {
      id: 'pdf' as ExportFormat,
      name: 'PDF',
      description: 'Portable Document Format',
      icon: '📄',
      extensions: ['.pdf']
    },
    {
      id: 'png' as ExportFormat,
      name: 'PNG',
      description: 'Portable Network Graphics',
      icon: '🖼️',
      extensions: ['.png']
    },
    {
      id: 'jpg' as ExportFormat,
      name: 'JPEG',
      description: 'Joint Photographic Experts Group',
      icon: '📸',
      extensions: ['.jpg', '.jpeg']
    },
    {
      id: 'svg' as ExportFormat,
      name: 'SVG',
      description: 'Scalable Vector Graphics',
      icon: '🎨',
      extensions: ['.svg']
    },
    {
      id: 'html' as ExportFormat,
      name: 'HTML',
      description: 'HyperText Markup Language',
      icon: '🌐',
      extensions: ['.html']
    },
    {
      id: 'txt' as ExportFormat,
      name: 'Text',
      description: 'Plain text file',
      icon: '📝',
      extensions: ['.txt']
    }
  ]

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const options: ExportOptions = {
        format: selectedFormat,
        quality: selectedFormat === 'jpg' ? quality : undefined,
        dpi: ['png', 'jpg'].includes(selectedFormat) ? dpi : undefined,
        includeImages,
        includeText,
        includeShapes,
        pageRange: {
          from: pageFrom,
          to: pageTo
        },
        backgroundColor: transparent ? undefined : backgroundColor,
        transparent: selectedFormat === 'png' ? transparent : undefined
      }

      await onExport(selectedFormat, options)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatSpecificOptions = () => {
    const format = exportFormats.find(f => f.id === selectedFormat)
    if (!format) return null

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          {format.name} Options
        </h4>

        {/* JPEG Quality */}
        {selectedFormat === 'jpg' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality: {quality}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Lower file size</span>
              <span>Higher quality</span>
            </div>
          </div>
        )}

        {/* DPI for image formats */}
        {['png', 'jpg'].includes(selectedFormat) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DPI (Dots Per Inch)
            </label>
            <select
              value={dpi}
              onChange={(e) => setDpi(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={72}>72 DPI (Web)</option>
              <option value={150}>150 DPI (Standard)</option>
              <option value={300}>300 DPI (Print)</option>
              <option value={600}>600 DPI (High Quality)</option>
            </select>
          </div>
        )}

        {/* Transparency for PNG */}
        {selectedFormat === 'png' && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="mr-2"
              />
              Transparent background
            </label>
          </div>
        )}

        {/* Background color */}
        {!transparent && ['png', 'jpg', 'svg', 'html'].includes(selectedFormat) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Export Document</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Choose Format</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{format.icon}</div>
                  <div className="font-medium text-sm">{format.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Page Range */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Page Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Page
                </label>
                <input
                  type="number"
                  min="1"
                  max={document?.pages.length || 1}
                  value={pageFrom}
                  onChange={(e) => setPageFrom(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Page
                </label>
                <input
                  type="number"
                  min={pageFrom}
                  max={document?.pages.length || 1}
                  value={pageTo}
                  onChange={(e) => setPageTo(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Content Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Content to Include</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeText}
                  onChange={(e) => setIncludeText(e.target.checked)}
                  className="mr-2"
                />
                Text elements
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="mr-2"
                />
                Images
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeShapes}
                  onChange={(e) => setIncludeShapes(e.target.checked)}
                  className="mr-2"
                />
                Shapes and drawings
              </label>
            </div>
          </div>

          {/* Format-Specific Options */}
          {getFormatSpecificOptions()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Exporting {pageTo - pageFrom + 1} page(s) as {selectedFormat.toUpperCase()}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportDialog