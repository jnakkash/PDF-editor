# PDF Editor

A comprehensive desktop PDF editor application built with Electron, React, and TypeScript.

## Features

- **Document Management**: Import, create, and export PDF documents
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **Cross-platform**: Runs on Windows, macOS, and Linux
- **Local Processing**: All operations performed locally for privacy
- **PDF Manipulation**: Built with PDF-lib and PDF.js for reliable PDF handling

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Commands

- **Start development server**: `npm run dev`
  - Runs both Vite dev server and Electron in development mode
  - Hot reload enabled for React components
  - Electron DevTools available

- **Build for production**: `npm run build`
  - Builds both renderer and main processes

- **Build application**: `npm run build:app`
  - Creates distributable application packages

### Project Structure

```
├── src/                    # React renderer process
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── assets/           # Static assets
├── electron/             # Electron main process
│   ├── main.ts           # Main process entry point
│   ├── preload.ts        # Preload script for IPC
│   └── tsconfig.json     # TypeScript config for Electron
├── dist-renderer/        # Built renderer process
├── dist-electron/        # Built main process
└── PRD.md               # Product Requirements Document
```

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Desktop**: Electron 37
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **PDF Processing**: PDF-lib + PDF.js
- **State Management**: React hooks

## Current Status

**Phase 1 & 2 Features Implemented:**
- ✅ Complete Electron + React + TypeScript setup
- ✅ PDF import/export with file system integration
- ✅ Modern responsive UI with Tailwind CSS
- ✅ PDF rendering and display with zoom controls
- ✅ **Advanced Text Editing**: Rich formatting (bold, italic, colors, fonts)
- ✅ **Image Management**: Insert, resize, move images with drag-and-drop upload
- ✅ **Shape Drawing**: Rectangle, circle, line tools with customizable colors
- ✅ **Element Manipulation**: Resize handles, move, rotate, delete with visual feedback
- ✅ **Copy/Paste System**: Full clipboard support with element duplication
- ✅ Undo/redo functionality with complete history management
- ✅ **Keyboard Shortcuts**: Professional shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, etc.)
- ✅ **Page Management**: Thumbnails, navigation, add/delete pages interface
- ✅ **Multi-tool System**: Select, Text, Image, Shape tools with context switching
- ✅ **Interactive Overlay**: Real-time element editing with selection handles
- ✅ **Zoom & Pan**: Responsive scaling with element preservation

## Next Steps (Phase 3)

1. **Advanced Features**
   - Search and replace functionality
   - Document metadata editor
   - Layer management system
   - Annotation tools and comments

2. **Performance & Optimization**
   - Large PDF performance optimization
   - Virtual scrolling for many pages
   - Memory usage optimization
   - Background processing

3. **Professional Features**
   - Export to multiple formats (Word, HTML, images)
   - Template system
   - Batch operations
   - Plugin architecture

## Key Features

- **🔒 Privacy-First**: All processing happens locally, no cloud uploads
- **🖥️ Cross-Platform**: Windows, macOS, Linux support
- **🎨 Professional Tools**: Text, image, shape editing with visual handles
- **⚡ Modern UI**: Clean, responsive interface with dark mode ready
- **⌨️ Keyboard Shortcuts**: Efficient workflow with standard shortcuts
- **↩️ Undo/Redo**: Complete history management with unlimited steps
- **📝 Element System**: Add, edit, move, resize, and delete any element
- **🖼️ Image Support**: Drag-and-drop image insertion with auto-scaling
- **🔧 Shape Tools**: Draw rectangles, circles, lines with custom styling
- **📋 Copy/Paste**: Full clipboard support with element duplication
- **🔍 Zoom & Pan**: Responsive scaling from 25% to 500% with element preservation

## Contributing

See PRD.md for detailed feature specifications and development phases.