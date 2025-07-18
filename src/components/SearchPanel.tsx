import React, { useState, useEffect, useCallback } from 'react'
import { PDFElement, TextElement } from '../types'

interface SearchResult {
  elementId: string
  pageNumber: number
  text: string
  matchStart: number
  matchEnd: number
  context: string
}

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
  document: any
  onHighlightElement: (elementId: string) => void
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
  document,
  onHighlightElement
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWords, setWholeWords] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentResultIndex, setCurrentResultIndex] = useState(0)
  const [isReplacing, setIsReplacing] = useState(false)

  const performSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const results: SearchResult[] = []
    const elements = document?.elements || []
    const textElements = elements.filter(el => el.type === 'text') as TextElement[]

    textElements.forEach(element => {
      let searchPattern: RegExp
      
      try {
        if (useRegex) {
          const flags = caseSensitive ? 'g' : 'gi'
          searchPattern = new RegExp(searchTerm, flags)
        } else {
          let escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          if (wholeWords) {
            escapedTerm = `\\b${escapedTerm}\\b`
          }
          const flags = caseSensitive ? 'g' : 'gi'
          searchPattern = new RegExp(escapedTerm, flags)
        }

        let match
        while ((match = searchPattern.exec(element.text)) !== null) {
          const contextStart = Math.max(0, match.index - 20)
          const contextEnd = Math.min(element.text.length, match.index + match[0].length + 20)
          const context = element.text.substring(contextStart, contextEnd)

          results.push({
            elementId: element.id,
            pageNumber: element.pageNumber,
            text: element.text,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
            context: contextStart > 0 ? '...' + context : context
          })

          // Prevent infinite loop with zero-width matches
          if (match[0].length === 0) {
            searchPattern.lastIndex++
          }
        }
      } catch (error) {
        console.warn('Invalid regex pattern:', error)
      }
    })

    setSearchResults(results)
    setCurrentResultIndex(0)
  }, [searchTerm, document, caseSensitive, wholeWords, useRegex])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [performSearch])

  const navigateToResult = useCallback((index: number) => {
    if (index < 0 || index >= searchResults.length) return

    const result = searchResults[index]
    setCurrentResultIndex(index)
    onHighlightElement(result.elementId)
  }, [searchResults, onHighlightElement])

  const handleNext = () => {
    const nextIndex = (currentResultIndex + 1) % searchResults.length
    navigateToResult(nextIndex)
  }

  const handlePrevious = () => {
    const prevIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1
    navigateToResult(prevIndex)
  }

  const handleReplace = () => {
    // TODO: Implement replace functionality
    console.log('Replace functionality not yet implemented')
  }

  const handleReplaceAll = async () => {
    // TODO: Implement replace all functionality
    console.log('Replace all functionality not yet implemented')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrevious()
      } else {
        handleNext()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Search & Replace</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter search term..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Replace Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Replace with
            </label>
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Enter replacement..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-2 text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="mr-1"
              />
              Case sensitive
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={wholeWords}
                onChange={(e) => setWholeWords(e.target.checked)}
                className="mr-1"
              />
              Whole words
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                className="mr-1"
              />
              Regex
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {searchTerm && (
          <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
            <span>
              {searchResults.length > 0 
                ? `${currentResultIndex + 1} of ${searchResults.length} results`
                : 'No results found'
              }
            </span>
            
            {searchResults.length > 0 && (
              <div className="flex space-x-1">
                <button
                  onClick={handlePrevious}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Previous (Shift+Enter)"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.41,7.41L14,6L8,12L14,18L15.41,16.59L10.83,12L15.41,7.41Z" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Next (Enter)"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10,6L8.59,7.41L13.17,12L8.59,16.59L10,18L16,12L10,6Z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Replace Buttons */}
        {searchResults.length > 0 && (
          <div className="flex space-x-2 mb-3">
            <button
              onClick={handleReplace}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={isReplacing}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isReplacing ? 'Replacing...' : 'Replace All'}
            </button>
          </div>
        )}

        {/* Current Result Context */}
        {searchResults.length > 0 && searchResults[currentResultIndex] && (
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="text-xs text-gray-500 mb-1">
              Page {searchResults[currentResultIndex].pageNumber}
            </div>
            <div className="font-mono text-gray-700 leading-relaxed">
              {searchResults[currentResultIndex].context}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-3 text-xs text-gray-500">
          Press Enter to go to next result, Shift+Enter for previous, Escape to close
        </div>
      </div>
    </div>
  )
}

export default SearchPanel