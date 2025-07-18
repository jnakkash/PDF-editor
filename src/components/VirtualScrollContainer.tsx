import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react'
import { usePerformanceOptimization } from '../utils/performanceUtils'

interface VirtualScrollContainerProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: any, index: number) => ReactNode
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
}

const VirtualScrollContainer: React.FC<VirtualScrollContainerProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 2,
  className = '',
  onScroll
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { debounceRender, calculateVisiblePages, throttle } = usePerformanceOptimization()

  const totalHeight = items.length * itemHeight
  
  // Calculate visible range
  const visibleRange = calculateVisiblePages(
    items,
    containerHeight,
    scrollTop,
    itemHeight,
    overscan
  )

  const { startIndex, endIndex, visiblePages } = visibleRange

  // Throttled scroll handler
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop
      setScrollTop(scrollTop)
      onScroll?.(scrollTop)
      
      setIsScrolling(true)
      
      // Clear existing timeout
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current)
      }
      
      // Set scrolling to false after scrolling stops
      scrollingTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 100)
    }, 16),
    [onScroll, throttle]
  )

  // Render visible items
  const renderVisibleItems = () => {
    const items = []
    
    for (let i = startIndex; i <= endIndex; i++) {
      const item = visiblePages[i - startIndex]
      if (item) {
        items.push(
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
              willChange: isScrolling ? 'transform' : 'auto'
            }}
          >
            {renderItem(item, i)}
          </div>
        )
      }
    }
    
    return items
  }

  // Optimize scroll performance
  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    // Add passive event listeners for better performance
    const options = { passive: true }
    
    const handleWheel = (e: WheelEvent) => {
      // Prevent default to allow custom scroll handling
      e.preventDefault()
      
      const delta = e.deltaY
      const newScrollTop = Math.max(0, Math.min(scrollTop + delta, totalHeight - containerHeight))
      
      if (newScrollTop !== scrollTop) {
        scrollElement.scrollTop = newScrollTop
      }
    }

    scrollElement.addEventListener('wheel', handleWheel, options)
    
    return () => {
      scrollElement.removeEventListener('wheel', handleWheel)
    }
  }, [scrollTop, totalHeight, containerHeight])

  // Smooth scrolling utilities
  const scrollToIndex = useCallback((index: number, behavior: 'auto' | 'smooth' = 'smooth') => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    const targetScrollTop = index * itemHeight
    
    if (behavior === 'smooth') {
      scrollElement.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    } else {
      scrollElement.scrollTop = targetScrollTop
    }
  }, [itemHeight])

  const scrollToTop = useCallback(() => {
    scrollToIndex(0)
  }, [scrollToIndex])

  const scrollToBottom = useCallback(() => {
    scrollToIndex(items.length - 1)
  }, [scrollToIndex, items.length])

  // Expose scroll methods via ref
  React.useImperativeHandle(scrollElementRef, () => ({
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getScrollTop: () => scrollTop,
    getVisibleRange: () => ({ startIndex, endIndex })
  }))

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        willChange: isScrolling ? 'scroll-position' : 'auto'
      }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {renderVisibleItems()}
      </div>
      
      {/* Scrolling indicator */}
      {isScrolling && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          {Math.round((scrollTop / (totalHeight - containerHeight)) * 100)}%
        </div>
      )}
    </div>
  )
}

export default VirtualScrollContainer

// Performance-optimized PDF page component
export const VirtualizedPDFPage: React.FC<{
  page: any
  index: number
  isVisible: boolean
  zoom: number
}> = React.memo(({ page, index, isVisible, zoom }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [imageData, setImageData] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isVisible) return

    // Lazy load page content
    const loadPage = async () => {
      if (page.content && !imageData) {
        setImageData(page.content)
        setIsLoaded(true)
      }
    }

    loadPage()
  }, [isVisible, page.content, imageData])

  if (!isVisible) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          color: '#666'
        }}
      >
        Loading page {index + 1}...
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {isLoaded && imageData ? (
        <img
          src={imageData}
          alt={`Page ${index + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center'
          }}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <div
          style={{
            width: '80%',
            height: '80%',
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#999'
          }}
        >
          Page {index + 1}
        </div>
      )}
    </div>
  )
})

VirtualizedPDFPage.displayName = 'VirtualizedPDFPage'