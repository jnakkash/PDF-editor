import React, { useState } from 'react'
import { PDFDocument, ElementLayer } from '../types'
import PageManager from './PageManager'
import LayerManager from './LayerManager'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  currentDocument: PDFDocument | null
  layers?: ElementLayer[]
  onUpdateLayer?: (layerId: string, updates: Partial<ElementLayer>) => void
  onCreateLayer?: (name: string) => void
  onDeleteLayer?: (layerId: string) => void
  onMoveElementToLayer?: (elementId: string, layerId: string) => void
  onReorderLayers?: (layerIds: string[]) => void
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  currentDocument, 
  layers = [],
  onUpdateLayer,
  onCreateLayer,
  onDeleteLayer,
  onMoveElementToLayer,
  onReorderLayers
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'bookmarks' | 'layers'>('pages')

  const tabs = [
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
    { id: 'layers', label: 'Layers', icon: '🔗' }
  ]

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-200 ${isOpen ? 'w-64' : 'w-0'}`}>
      <div className="flex h-full">
        {/* Tab buttons */}
        <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col">
          <button
            onClick={onToggle}
            className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-b border-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 text-sm hover:bg-gray-100 border-b border-gray-200 ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
              title={tab.label}
            >
              <span className="text-lg">{tab.icon}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {isOpen && (
            <div className="p-4 h-full overflow-y-auto">
              {activeTab === 'pages' && (
                <PageManager
                  document={currentDocument}
                  onPageSelect={(pageNumber) => {
                    console.log('Selected page:', pageNumber)
                    // TODO: Scroll to page
                  }}
                  onPageAdd={(afterPage) => {
                    console.log('Add page after:', afterPage)
                    // TODO: Add new page
                  }}
                  onPageDelete={(pageNumber) => {
                    console.log('Delete page:', pageNumber)
                    // TODO: Delete page
                  }}
                  onPageDuplicate={(pageNumber) => {
                    console.log('Duplicate page:', pageNumber)
                    // TODO: Duplicate page
                  }}
                />
              )}

              {activeTab === 'bookmarks' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Bookmarks</h3>
                  <div className="text-sm text-gray-500">No bookmarks available</div>
                </div>
              )}

              {activeTab === 'layers' && (
                <LayerManager
                  layers={layers}
                  elements={currentDocument?.elements || []}
                  onUpdateLayer={onUpdateLayer || (() => {})}
                  onCreateLayer={onCreateLayer || (() => {})}
                  onDeleteLayer={onDeleteLayer || (() => {})}
                  onMoveElementToLayer={onMoveElementToLayer || (() => {})}
                  onReorderLayers={onReorderLayers || (() => {})}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar