'use client';

import React, { useEffect } from 'react';

interface PlatformProviderProps {
  children: React.ReactNode;
}

export function PlatformProvider({ children }: PlatformProviderProps) {
  useEffect(() => {
    // Only run on client side after hydration to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      // Check if we're in Electron
      const isElectron = window.electronAPI !== undefined;
      
      if (isElectron) {
        // Add Electron-specific class
        document.body.classList.add('electron-app');
        
        // Add platform-specific class for Windows
        if (process.platform === 'win32') {
          document.body.classList.add('platform-win32');
        } else if (process.platform === 'darwin') {
          document.body.classList.add('platform-darwin');
        } else if (process.platform === 'linux') {
          document.body.classList.add('platform-linux');
        }
      } else {
        // Add web-specific class
        document.body.classList.add('web-app');
      }
    }

    // Cleanup function to remove classes when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('electron-app', 'web-app', 'platform-win32', 'platform-darwin', 'platform-linux');
      }
    };
  }, []);

  return <>{children}</>;
}
