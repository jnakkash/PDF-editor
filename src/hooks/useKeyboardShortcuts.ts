import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onUndo: () => void
  onRedo: () => void
  onSelectAll: () => void
  onDelete: () => void
  onCopy: () => void
  onPaste: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomFit: () => void
  canUndo: boolean
  canRedo: boolean
}

export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onSelectAll,
  onDelete,
  onCopy,
  onPaste,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  canUndo,
  canRedo
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      const isShift = event.shiftKey

      // Don't handle shortcuts if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Prevent default for handled shortcuts
      let handled = false

      if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 'z':
            if (isShift && canRedo) {
              onRedo()
              handled = true
            } else if (!isShift && canUndo) {
              onUndo()
              handled = true
            }
            break
          
          case 'y':
            if (canRedo) {
              onRedo()
              handled = true
            }
            break
          
          case 'a':
            onSelectAll()
            handled = true
            break
          
          case 'c':
            onCopy()
            handled = true
            break
          
          case 'v':
            onPaste()
            handled = true
            break
          
          case '=':
          case '+':
            onZoomIn()
            handled = true
            break
          
          case '-':
            onZoomOut()
            handled = true
            break
          
          case '0':
            onZoomFit()
            handled = true
            break
        }
      }

      // Delete key (without modifier)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!isCtrlOrCmd) {
          onDelete()
          handled = true
        }
      }

      // Escape key
      if (event.key === 'Escape') {
        // Could be used to clear selection or cancel current operation
        handled = true
      }

      if (handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    onUndo,
    onRedo,
    onSelectAll,
    onDelete,
    onCopy,
    onPaste,
    onZoomIn,
    onZoomOut,
    onZoomFit,
    canUndo,
    canRedo
  ])
}