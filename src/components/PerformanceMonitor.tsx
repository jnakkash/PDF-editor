import React, { useState, useEffect, useCallback } from 'react'
import { usePerformanceOptimization } from '../utils/performanceUtils'

interface PerformanceMonitorProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isEnabled,
  onToggle,
  className = ''
}) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    elementCount: 0,
    pageCount: 0,
    cacheSize: 0,
    isMemoryPressure: false
  })
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  
  const { getMetrics, handleMemoryPressure } = usePerformanceOptimization()

  // FPS calculation
  const fpsRef = React.useRef(0)
  const frameCountRef = React.useRef(0)
  const lastTimeRef = React.useRef(performance.now())

  const updateFPS = useCallback(() => {
    const now = performance.now()
    frameCountRef.current++
    
    if (now - lastTimeRef.current >= 1000) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  }, [])

  // Memory usage calculation
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      // @ts-ignore
      const memory = (performance as any).memory
      return memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0
    }
    return 0
  }, [])

  // Update metrics
  useEffect(() => {
    if (!isEnabled) return

    const interval = setInterval(() => {
      updateFPS()
      
      const performanceMetrics = getMetrics()
      const memoryUsage = getMemoryUsage()
      
      const newMetrics = {
        fps: fpsRef.current,
        renderTime: performanceMetrics.renderTime,
        memoryUsage,
        elementCount: performanceMetrics.elementCount,
        pageCount: performanceMetrics.pageCount,
        cacheSize: 0, // TODO: Get actual cache size
        isMemoryPressure: memoryUsage > 100 // 100MB threshold
      }
      
      setMetrics(newMetrics)
      
      // Update FPS history for graph
      setHistory(prev => {
        const newHistory = [...prev, fpsRef.current]
        return newHistory.slice(-60) // Keep last 60 frames (1 second at 60fps)
      })

      // Handle memory pressure
      if (newMetrics.isMemoryPressure) {
        handleMemoryPressure()
      }
    }, 1000 / 60) // Update at 60fps

    return () => clearInterval(interval)
  }, [isEnabled, updateFPS, getMetrics, getMemoryUsage, handleMemoryPressure])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getPerformanceColor = (fps: number): string => {
    if (fps >= 50) return '#4caf50' // Green
    if (fps >= 30) return '#ff9800' // Orange
    return '#f44336' // Red
  }

  const renderMiniGraph = () => {
    if (history.length < 2) return null

    const maxFPS = Math.max(...history)
    const points = history.map((fps, index) => {
      const x = (index / (history.length - 1)) * 100
      const y = 100 - (fps / maxFPS) * 100
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width="60" height="30" className="ml-2">
        <polyline
          points={points}
          fill="none"
          stroke={getPerformanceColor(metrics.fps)}
          strokeWidth="1"
        />
      </svg>
    )
  }

  if (!isEnabled) {
    return (
      <button
        onClick={() => onToggle(true)}
        className={`fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors ${className}`}
        title="Show Performance Monitor"
      >
        📊
      </button>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-lg z-50 ${className}`}>
      {/* Collapsed View */}
      <div className="p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getPerformanceColor(metrics.fps) }}
            />
            <span className="text-sm font-mono">
              {metrics.fps} FPS
            </span>
          </div>
          
          {renderMiniGraph()}
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(false)
            }}
            className="text-gray-400 hover:text-white ml-2"
            title="Hide Performance Monitor"
          >
            ×
          </button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-3 min-w-64">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className="font-mono" style={{ color: getPerformanceColor(metrics.fps) }}>
                {metrics.fps}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Render Time:</span>
              <span className="font-mono">
                {metrics.renderTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={`font-mono ${metrics.isMemoryPressure ? 'text-red-400' : ''}`}>
                {metrics.memoryUsage}MB
                {metrics.isMemoryPressure && ' ⚠️'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Elements:</span>
              <span className="font-mono">{metrics.elementCount}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Pages:</span>
              <span className="font-mono">{metrics.pageCount}</span>
            </div>

            {/* Performance Tips */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="text-xs text-gray-400 space-y-1">
                {metrics.fps < 30 && (
                  <div className="text-yellow-400">
                    ⚠️ Low FPS - Consider reducing zoom or elements
                  </div>
                )}
                {metrics.isMemoryPressure && (
                  <div className="text-red-400">
                    🚨 High memory usage - Clearing caches
                  </div>
                )}
                {metrics.renderTime > 16 && (
                  <div className="text-orange-400">
                    🐌 Slow rendering - Consider virtualization
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
              <button
                onClick={() => {
                  if ('gc' in window) {
                    // @ts-ignore
                    window.gc()
                  }
                  handleMemoryPressure()
                }}
                className="w-full text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
              >
                🧹 Clear Cache
              </button>
              
              <button
                onClick={() => {
                  // Toggle WebGL if available
                  console.log('WebGL optimization toggled')
                }}
                className="w-full text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
              >
                🚀 Optimize Rendering
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor

// Performance Context for app-wide performance tracking
export const PerformanceContext = React.createContext({
  isMonitoring: false,
  enableMonitoring: () => {},
  disableMonitoring: () => {},
  getMetrics: () => ({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    elementCount: 0,
    pageCount: 0
  })
})

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const { getMetrics } = usePerformanceOptimization()

  const enableMonitoring = useCallback(() => {
    setIsMonitoring(true)
    console.log('Performance monitoring enabled')
  }, [])

  const disableMonitoring = useCallback(() => {
    setIsMonitoring(false)
    console.log('Performance monitoring disabled')
  }, [])

  const value = {
    isMonitoring,
    enableMonitoring,
    disableMonitoring,
    getMetrics
  }

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  )
}