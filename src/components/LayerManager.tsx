import React, { useState, useCallback } from 'react'
import { ElementLayer, PDFElement } from '../types'

interface LayerManagerProps {
  layers: ElementLayer[]
  elements: PDFElement[]
  onUpdateLayer: (layerId: string, updates: Partial<ElementLayer>) => void
  onCreateLayer: (name: string) => void
  onDeleteLayer: (layerId: string) => void
  onMoveElementToLayer: (elementId: string, layerId: string) => void
  onReorderLayers: (layerIds: string[]) => void
}

const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  elements,
  onUpdateLayer,
  onCreateLayer,
  onDeleteLayer,
  onMoveElementToLayer,
  onReorderLayers
}) => {
  const [newLayerName, setNewLayerName] = useState('')
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null)

  const handleCreateLayer = () => {
    if (newLayerName.trim()) {
      onCreateLayer(newLayerName.trim())
      setNewLayerName('')
    }
  }

  const handleStartEdit = (layer: ElementLayer) => {
    setEditingLayerId(layer.id)
    setEditingName(layer.name)
  }

  const handleSaveEdit = () => {
    if (editingLayerId && editingName.trim()) {
      onUpdateLayer(editingLayerId, { name: editingName.trim() })
    }
    setEditingLayerId(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingLayerId(null)
    setEditingName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleToggleVisibility = (layerId: string, visible: boolean) => {
    onUpdateLayer(layerId, { visible })
  }

  const handleToggleLock = (layerId: string, locked: boolean) => {
    onUpdateLayer(layerId, { locked })
  }

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault()
    
    if (draggedLayerId && draggedLayerId !== targetLayerId) {
      const currentOrder = layers.map(layer => layer.id)
      const draggedIndex = currentOrder.indexOf(draggedLayerId)
      const targetIndex = currentOrder.indexOf(targetLayerId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...currentOrder]
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedLayerId)
        onReorderLayers(newOrder)
      }
    }
    
    setDraggedLayerId(null)
  }

  const getLayerElementCount = (layerId: string) => {
    return elements.filter(element => {
      // For now, assume all elements are on the default layer
      // In a real implementation, elements would have a layerId property
      return layerId === 'default'
    }).length
  }

  const getLayerElements = (layerId: string) => {
    return elements.filter(element => {
      // For now, assume all elements are on the default layer
      return layerId === 'default'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Layers</h3>
        <button
          onClick={() => setNewLayerName('New Layer')}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          + Add Layer
        </button>
      </div>

      {/* New Layer Input */}
      {newLayerName && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateLayer()
                } else if (e.key === 'Escape') {
                  setNewLayerName('')
                }
              }}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Layer name"
              autoFocus
            />
            <button
              onClick={handleCreateLayer}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => setNewLayerName('')}
              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Layers List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`group relative bg-gray-50 rounded-lg p-3 border transition-colors ${
              draggedLayerId === layer.id ? 'opacity-50' : 'hover:bg-gray-100'
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, layer.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, layer.id)}
          >
            <div className="flex items-center space-x-2">
              {/* Drag Handle */}
              <div className="w-4 h-4 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3,15H21V13H3V15M3,19H21V17H3V19M3,11H21V9H3V11M3,5V7H21V5H3Z" />
                </svg>
              </div>

              {/* Layer Name */}
              <div className="flex-1 min-w-0">
                {editingLayerId === layer.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveEdit}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-sm font-medium text-gray-900 truncate cursor-pointer"
                    onClick={() => handleStartEdit(layer)}
                  >
                    {layer.name}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  {getLayerElementCount(layer.id)} elements
                </div>
              </div>

              {/* Layer Controls */}
              <div className="flex items-center space-x-1">
                {/* Visibility Toggle */}
                <button
                  onClick={() => handleToggleVisibility(layer.id, !layer.visible)}
                  className={`p-1 rounded hover:bg-gray-200 ${
                    layer.visible ? 'text-gray-700' : 'text-gray-400'
                  }`}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                    </svg>
                  )}
                </button>

                {/* Lock Toggle */}
                <button
                  onClick={() => handleToggleLock(layer.id, !layer.locked)}
                  className={`p-1 rounded hover:bg-gray-200 ${
                    layer.locked ? 'text-red-600' : 'text-gray-400'
                  }`}
                  title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                >
                  {layer.locked ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z" />
                    </svg>
                  )}
                </button>

                {/* Delete Layer */}
                {layers.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${layer.name}"?`)) {
                        onDeleteLayer(layer.id)
                      }
                    }}
                    className="p-1 rounded hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete layer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Layer Elements Preview */}
            {layer.visible && getLayerElements(layer.id).length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {getLayerElements(layer.id).slice(0, 5).map(element => (
                    <span
                      key={element.id}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      {element.type}
                    </span>
                  ))}
                  {getLayerElements(layer.id).length > 5 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{getLayerElements(layer.id).length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Layer Statistics */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Total layers: {layers.length}</span>
          <span>Visible: {layers.filter(l => l.visible).length}</span>
        </div>
      </div>
    </div>
  )
}

export default LayerManager