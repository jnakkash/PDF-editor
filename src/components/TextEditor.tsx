import React, { useState, useRef, useEffect } from 'react'

interface TextEditorProps {
  x: number
  y: number
  initialText?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  onSave: (text: string) => void
  onCancel: () => void
}

const TextEditor: React.FC<TextEditorProps> = ({
  x,
  y,
  initialText = '',
  fontSize = 16,
  fontFamily = 'Arial',
  color = '#000000',
  onSave,
  onCancel
}) => {
  const [text, setText] = useState(initialText)
  const [currentFontSize, setCurrentFontSize] = useState(fontSize)
  const [currentColor, setCurrentColor] = useState(color)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [])

  const handleSave = () => {
    onSave(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const getFontWeight = () => isBold ? 'bold' : 'normal'
  const getFontStyle = () => isItalic ? 'italic' : 'normal'

  return (
    <div
      className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        minWidth: '300px'
      }}
    >
      {/* Toolbar */}
      <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-1">
          <label className="text-xs text-gray-600">Size:</label>
          <input
            type="number"
            value={currentFontSize}
            onChange={(e) => setCurrentFontSize(parseInt(e.target.value))}
            className="w-16 px-1 py-1 text-xs border border-gray-300 rounded"
            min="8"
            max="72"
          />
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsBold(!isBold)}
            className={`px-2 py-1 text-xs rounded ${
              isBold ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`px-2 py-1 text-xs rounded ${
              isItalic ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <em>I</em>
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <label className="text-xs text-gray-600">Color:</label>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-24 px-3 py-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter text here..."
        style={{
          fontSize: `${currentFontSize}px`,
          fontFamily: fontFamily,
          color: currentColor,
          fontWeight: getFontWeight(),
          fontStyle: getFontStyle()
        }}
      />

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 mt-3">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        Press Ctrl+Enter to save, Escape to cancel
      </div>
    </div>
  )
}

export default TextEditor