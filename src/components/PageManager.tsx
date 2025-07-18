import React from 'react'
import { PDFDocument, PDFPage } from '../types'

interface PageManagerProps {
  document: PDFDocument | null
  currentPageNumber?: number
  onPageSelect?: (pageNumber: number) => void
  onPageAdd?: (afterPage?: number) => void
  onPageDelete?: (pageNumber: number) => void
  onPageDuplicate?: (pageNumber: number) => void
  onPageReorder?: (fromIndex: number, toIndex: number) => void
}

const PageManager: React.FC<PageManagerProps> = ({
  document,
  currentPageNumber = 1,
  onPageSelect,
  onPageAdd,
  onPageDelete,
  onPageDuplicate,
  onPageReorder
}) => {
  if (!document) {
    return (
      <div className="text-sm text-gray-500 p-4">
        No document loaded
      </div>
    )
  }

  const handlePageClick = (pageNumber: number) => {
    onPageSelect?.(pageNumber)
  }

  const handleAddPage = () => {
    onPageAdd?.(document.pages.length)
  }

  const handleDeletePage = (pageNumber: number, event: React.MouseEvent) => {
    event.stopPropagation()
    if (document.pages.length > 1) {
      onPageDelete?.(pageNumber)
    }
  }

  const handleDuplicatePage = (pageNumber: number, event: React.MouseEvent) => {
    event.stopPropagation()
    onPageDuplicate?.(pageNumber)
  }

  return (
    <div className="space-y-2">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Pages</h3>
        <button
          onClick={handleAddPage}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Pages List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {document.pages.map((page, index) => (
          <div
            key={page.id}
            className={`group relative bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors ${
              currentPageNumber === page.pageNumber ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handlePageClick(page.pageNumber)}
          >
            <div className="flex items-center space-x-3">
              {/* Page Thumbnail */}
              <div className="flex-shrink-0">
                <div className="w-12 h-16 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center">
                  {page.content ? (
                    <img
                      src={page.content}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center">
                      <div className="text-lg">📄</div>
                      <div>{page.pageNumber}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Page Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  Page {page.pageNumber}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(page.width)} × {Math.round(page.height)}
                </div>
                {page.rotation !== 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Rotated {page.rotation}°
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => handleDuplicatePage(page.pageNumber, e)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                    title="Duplicate page"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {document.pages.length > 1 && (
                    <button
                      onClick={(e) => handleDeletePage(page.pageNumber, e)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                      title="Delete page"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Drag Handle */}
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1 h-6 bg-gray-400 rounded-full cursor-move" title="Drag to reorder">
                <div className="w-full h-full bg-gradient-to-b from-gray-300 to-gray-500 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Page Statistics */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Total pages: {document.pages.length}</span>
          <span>Current: {currentPageNumber}</span>
        </div>
      </div>
    </div>
  )
}

export default PageManager