import { useEffect, useCallback } from 'react';

// Type definitions for the Electron API
declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>;
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      onOpenAddBookmark: (callback: () => void) => void;
      onOpenImport: (callback: () => void) => void;
      onOpenExport: (callback: () => void) => void;
      onOpenSettings: (callback: () => void) => void;
      onOpenAnalytics: (callback: () => void) => void;
      onFocusSearch: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
      platform: string;
      shouldUseDarkColors: () => Promise<boolean>;
      onThemeUpdated: (callback: (event: any, shouldUseDarkColors: boolean) => void) => void;
    };
  }
}

export const useElectron = () => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // App version
  const getAppVersion = useCallback(async () => {
    if (isElectron) {
      try {
        return await window.electronAPI!.getAppVersion();
      } catch (error) {
        console.error('Failed to get app version:', error);
        return '1.0.0';
      }
    }
    return '1.0.0 (Web)';
  }, [isElectron]);

  // File dialogs
  const showSaveDialog = useCallback(async (options: any) => {
    if (isElectron) {
      try {
        return await window.electronAPI!.showSaveDialog(options);
      } catch (error) {
        console.error('Failed to show save dialog:', error);
        return { canceled: true };
      }
    }
    return { canceled: true };
  }, [isElectron]);

  const showOpenDialog = useCallback(async (options: any) => {
    if (isElectron) {
      try {
        return await window.electronAPI!.showOpenDialog(options);
      } catch (error) {
        console.error('Failed to show open dialog:', error);
        return { canceled: true };
      }
    }
    return { canceled: true };
  }, [isElectron]);

  // Platform detection
  const platform = isElectron ? window.electronAPI!.platform : 'web';

  // Theme detection
  const shouldUseDarkColors = useCallback(async () => {
    if (isElectron) {
      try {
        return await window.electronAPI!.shouldUseDarkColors();
      } catch (error) {
        console.error('Failed to get theme preference:', error);
        return false;
      }
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [isElectron]);

  return {
    isElectron,
    platform,
    getAppVersion,
    showSaveDialog,
    showOpenDialog,
    shouldUseDarkColors
  };
};

// Hook for handling Electron menu events
export const useElectronMenuEvents = (callbacks: {
  onAddBookmark?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  onAnalytics?: () => void;
  onFocusSearch?: () => void;
}) => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  useEffect(() => {
    if (!isElectron) return;

    const { electronAPI } = window;

    // Set up event listeners
    if (callbacks.onAddBookmark) {
      electronAPI!.onOpenAddBookmark(callbacks.onAddBookmark);
    }
    if (callbacks.onImport) {
      electronAPI!.onOpenImport(callbacks.onImport);
    }
    if (callbacks.onExport) {
      electronAPI!.onOpenExport(callbacks.onExport);
    }
    if (callbacks.onSettings) {
      electronAPI!.onOpenSettings(callbacks.onSettings);
    }
    if (callbacks.onAnalytics) {
      electronAPI!.onOpenAnalytics(callbacks.onAnalytics);
    }
    if (callbacks.onFocusSearch) {
      electronAPI!.onFocusSearch(callbacks.onFocusSearch);
    }

    // Cleanup function
    return () => {
      electronAPI!.removeAllListeners('open-add-bookmark');
      electronAPI!.removeAllListeners('open-import');
      electronAPI!.removeAllListeners('open-export');
      electronAPI!.removeAllListeners('open-settings');
      electronAPI!.removeAllListeners('open-analytics');
      electronAPI!.removeAllListeners('focus-search');
    };
  }, [callbacks, isElectron]);
};
