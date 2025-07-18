import React, { useRef, useState } from 'react'

interface ImageUploaderProps {
  x: number
  y: number
  onImageSelected: (src: string, width: number, height: number) => void
  onCancel: () => void
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  x,
  y,
  onImageSelected,
  onCancel
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        onImageSelected(e.target?.result as string, img.naturalWidth, img.naturalHeight)
        setLoading(false)
      }
      img.onerror = () => {
        alert('Failed to load image')
        setLoading(false)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-6 z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: '320px'
      }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Insert Image</h3>
        <p className="text-sm text-gray-600 mt-1">
          Upload an image to insert into the PDF
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading image...</p>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-3">
            <div className="text-4xl text-gray-400">🖼️</div>
            <div>
              <p className="text-sm text-gray-600">
                Drag and drop an image here, or
              </p>
              <button
                onClick={handleBrowseClick}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                browse to upload
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Supports: JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
          disabled={loading}
        >
          Cancel
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Press Escape to cancel
      </div>
    </div>
  )
}

export default ImageUploader