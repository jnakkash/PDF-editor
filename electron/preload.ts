import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  openFileDialog: () => Promise<{
    success: boolean
    data?: number[]
    fileName?: string
    error?: string
  }>
  saveFileDialog: (data: Uint8Array, defaultName: string) => Promise<{
    success: boolean
    filePath?: string
    error?: string
  }>
  onMenuAction: (callback: (action: string) => void) => void
}

const electronAPI: ElectronAPI = {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (data: Uint8Array, defaultName: string) => 
    ipcRenderer.invoke('save-file-dialog', data, defaultName),
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-new-file', () => callback('new-file'))
    ipcRenderer.on('menu-open-file', () => callback('open-file'))
    ipcRenderer.on('menu-save-file', () => callback('save-file'))
    ipcRenderer.on('menu-save-as-file', () => callback('save-as-file'))
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}