const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Menu actions - listen for menu events
  onOpenAddBookmark: (callback) => ipcRenderer.on('open-add-bookmark', callback),
  onOpenImport: (callback) => ipcRenderer.on('open-import', callback),
  onOpenExport: (callback) => ipcRenderer.on('open-export', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onOpenAnalytics: (callback) => ipcRenderer.on('open-analytics', callback),
  onFocusSearch: (callback) => ipcRenderer.on('focus-search', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  
  // Theme
  shouldUseDarkColors: () => ipcRenderer.invoke('should-use-dark-colors'),
  onThemeUpdated: (callback) => ipcRenderer.on('theme-updated', callback)
});

// DOM Content Loaded handler
document.addEventListener('DOMContentLoaded', () => {
  // Platform-specific classes are now handled by React PlatformProvider
  // to prevent hydration mismatches
  
  // Handle keyboard shortcuts that might not be caught by the menu
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + R for reload (in development)
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      if (process.env.NODE_ENV === 'development') {
        location.reload();
      }
    }
    
    // Ctrl/Cmd + Shift + I for DevTools (in development)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'I') {
      if (process.env.NODE_ENV === 'development') {
        // DevTools toggle is handled by Electron menu
      }
    }
  });
});
