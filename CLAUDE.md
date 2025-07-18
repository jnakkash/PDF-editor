# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PDF Editor application project currently in the planning/design phase. The repository contains a comprehensive Product Requirements Document (PRD.md) that outlines the vision for building a desktop PDF editing application.

## Current State

The project has been initialized with a working Electron + React + TypeScript application:
- ✅ Complete project structure with Electron main process and React renderer
- ✅ TypeScript configuration for both main and renderer processes
- ✅ Vite build system with Tailwind CSS styling
- ✅ PDF import/export functionality using PDF-lib and PDF.js
- ✅ Modern UI with header, sidebar, and main canvas
- ✅ File system integration for opening and saving PDFs
- ✅ Basic PDF loading and display architecture
- 🔄 PDF editing features (ready for implementation)

## Planned Architecture

Based on the PRD, this will be a desktop application with the following tech stack:
- **Platform**: Desktop application (Electron + React)
- **Frontend**: React 18+ with TypeScript
- **PDF Library**: PDF-lib.js or Electron-PDF
- **State Management**: Zustand or Redux Toolkit
- **UI Framework**: Tailwind CSS + Headless UI
- **Build Tool**: Vite + Electron Builder
- **Testing**: Vitest + React Testing Library

## Development Environment

**Virtual Environment**: 
- A Python 3.13 virtual environment is set up in `venv/`
- Activate with: `source venv/bin/activate` (macOS/Linux) or `venv\Scripts\activate` (Windows)

**Common Commands**:
- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Build for production: `npm run build`
- Build application package: `npm run build:app`
- Build renderer only: `npm run build:vite`
- Build main process only: `npm run build:electron`

## Core Features to Implement

The application will have these major feature areas:
1. **Document Management**: PDF import/export, creation, file handling
2. **Text Editing**: In-place text editing, formatting, search/replace
3. **Page Management**: Add/delete/reorder pages, rotation, resizing
4. **Visual Elements**: Image insertion, shapes, drawing tools, forms
5. **Document Structure**: Bookmarks, TOC, metadata, links, annotations
6. **Document Cleaning**: Optimization, duplicate removal, structure validation
7. **Export/Sharing**: Multiple format export, print functionality

## Development Phases

The project is planned in 4 phases:
- **Phase 1 (MVP)**: Core PDF editing functionality
- **Phase 2**: Visual elements and document cleaning
- **Phase 3**: Professional features and batch processing
- **Phase 4**: Polish, optimization, and accessibility

## Key Requirements

- **Privacy-first**: Local processing only, no cloud uploads
- **Cross-platform**: Windows, macOS, and Linux support
- **Performance**: Handle documents up to 500MB, smooth 60fps interactions
- **Accessibility**: WCAG 2.1 AA compliance

## File Structure

```
├── src/                    # React renderer process
│   ├── components/        # React components (Header, Sidebar, MainCanvas)
│   ├── hooks/            # Custom React hooks (usePDF)
│   ├── utils/            # Utility functions (pdfUtils)
│   ├── types/            # TypeScript type definitions
│   └── assets/           # Static assets
├── electron/             # Electron main process
│   ├── main.ts           # Main process entry point
│   ├── preload.ts        # Preload script for IPC
│   └── tsconfig.json     # TypeScript config for Electron
├── dist-renderer/        # Built renderer process
├── dist-electron/        # Built main process
├── PRD.md               # Complete product requirements
├── README.md            # Development instructions
├── CLAUDE.md            # This guidance file
└── venv/                # Python virtual environment (legacy)
```

## Implementation Status

### Phase 1: Core Foundation ✅ COMPLETED
- ✅ Electron + React + TypeScript setup complete
- ✅ PDF viewing with zoom controls (25% - 500%)
- ✅ Basic element system (text, images, shapes)
- ✅ File operations (new, open, save, save-as)
- ✅ Keyboard shortcuts and copy/paste system
- ✅ Undo/redo functionality with history tracking

### Phase 2: Advanced Editing ✅ COMPLETED  
- ✅ Image insertion with drag-and-drop support
- ✅ Shape drawing tools (rectangle, circle, line)
- ✅ Element manipulation handles (resize, move, delete)
- ✅ Enhanced text editing with formatting options
- ✅ Element selection and multi-select functionality
- ✅ Full element management system with state

### Phase 3: Professional Features ✅ COMPLETED
- ✅ Search and replace functionality with regex support
- ✅ Document metadata editor with form validation  
- ✅ Layer management system with drag-and-drop reordering
- ✅ Export dialog for multiple formats (PDF, PNG, JPG, SVG, HTML, TXT)
- ✅ Element highlighting system for search results
- ✅ Integrated modal system for advanced features
- ✅ Sidebar with tabbed interface (Pages, Bookmarks, Layers)

### Phase 4: Advanced Features ✅ COMPLETED
- ✅ Annotation tools and comments system with 6 annotation types
- ✅ Performance optimizations for large documents with monitoring
- ✅ Multi-format export system (PDF, PNG, JPG, SVG, HTML, TXT)
- ✅ Real-time performance monitoring with FPS tracking
- ✅ Memory management and cache optimization
- ✅ Virtual scrolling support for large documents

### Phase 5: Remaining Tasks 🔄 PENDING
- 🔄 Template system for reusable layouts
- 🔄 Batch operations for multiple files
- 🔄 Document comparison tools
- 🔄 Accessibility enhancements

## Current Capabilities

The PDF editor now includes:
- **Complete UI Framework**: Modern React components with Tailwind CSS
- **PDF Processing**: PDF-lib for manipulation, PDF.js for rendering
- **Element System**: Text, images, shapes, and annotations with full CRUD operations
- **Search System**: Advanced search with regex support, highlighting, and navigation
- **Layer Management**: Professional layer system with visibility/lock controls
- **Export Options**: Multiple format support (PDF, PNG, JPG, SVG, HTML, TXT) with customizable settings
- **Annotation System**: 6 annotation types (highlight, note, stamp, freehand, callout, arrow)
- **Comment System**: Threaded comments with resolve/unresolve functionality
- **Performance Optimization**: Real-time monitoring, memory management, and virtual scrolling
- **Keyboard Shortcuts**: Full productivity shortcuts (Ctrl+Z/Y, Ctrl+C/V/X, Ctrl+Shift+P for performance monitor)
- **File Management**: Complete file operations with Electron integration