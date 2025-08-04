const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev') && process.env.NODE_ENV !== 'production';
const http = require('http');
const fs = require('fs');
const url = require('url');
const WindowsIntegration = require('./windows-integration');

// Optional auto-updater
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
  console.log('electron-updater not available');
}

// Keep a global reference of the window object
let mainWindow;
let tray = null;
let localServer = null;
let isQuitting = false;
let windowsIntegration;

// Enable live reload for Electron in development
if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (e) {
    console.log('electron-reload not available, continuing without hot reload');
  }
}

// Create a simple HTTP server to serve static files
function createLocalServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url);
      let pathname = parsedUrl.pathname;

      // Default to index.html
      if (pathname === '/') {
        pathname = '/index.html';
      }

      const filePath = path.join(__dirname, '../out', pathname);

      // Check if file exists
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }

        // Determine content type
        const ext = path.extname(filePath);
        let contentType = 'text/html';

        switch (ext) {
          case '.js':
            contentType = 'application/javascript';
            break;
          case '.css':
            contentType = 'text/css';
            break;
          case '.json':
            contentType = 'application/json';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.svg':
            contentType = 'image/svg+xml';
            break;
          case '.ico':
            contentType = 'image/x-icon';
            break;
          case '.woff':
          case '.woff2':
            contentType = 'font/woff2';
            break;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      });
    });

    // Find an available port starting from 8080
    const tryPort = (port) => {
      server.listen(port, 'localhost', () => {
        console.log(`Local server started on http://localhost:${port}`);
        resolve(port);
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
    };

    tryPort(8080);
    localServer = server;
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'), // App icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    frame: true
  });

  // Load the app
  if (isDev) {
    const startUrl = 'http://localhost:3000';
    console.log('Loading URL:', startUrl);
    console.log('isDev:', isDev);

    mainWindow.loadURL(startUrl).catch(err => {
      console.error('Failed to load URL:', err);
      // Fallback to built files if dev server fails
      const fallbackUrl = `file://${path.join(__dirname, '../out/index.html')}`;
      console.log('Trying fallback URL:', fallbackUrl);
      mainWindow.loadURL(fallbackUrl);
    });
  } else {
    // In production, start local server and load from it
    console.log('Starting local server for production...');
    createLocalServer().then(port => {
      const startUrl = `http://localhost:${port}`;
      console.log('Loading URL:', startUrl);

      mainWindow.loadURL(startUrl).catch(err => {
        console.error('Failed to load URL:', err);
      });
    }).catch(err => {
      console.error('Failed to start local server:', err);
      // Fallback to file protocol
      const fallbackUrl = `file://${path.join(__dirname, '../out/index.html')}`;
      console.log('Trying fallback URL:', fallbackUrl);
      mainWindow.loadURL(fallbackUrl);
    });
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Initialize Windows integration
    if (process.platform === 'win32') {
      try {
        windowsIntegration = new WindowsIntegration(mainWindow);
      } catch (error) {
        console.error('Failed to initialize Windows integration:', error);
      }
    }

    // Focus on window
    // Developer tools disabled for production use
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window minimize behavior
  mainWindow.on('minimize', (event) => {
    // Option 1: Normal minimize to taskbar (recommended for better UX)
    // Just let the default minimize behavior happen - no event.preventDefault()

    // Option 2: Minimize to system tray (uncomment the lines below if you prefer this)
    // if (process.platform === 'win32' && tray) {
    //   event.preventDefault();
    //   mainWindow.hide();
    // }
  });

  // Handle window close behavior
  mainWindow.on('close', (event) => {
    // Option 1: Normal close behavior (recommended for better UX)
    // Just let the app close normally when X button is clicked

    // Option 2: Close to system tray (uncomment the lines below if you prefer this)
    // if (!isQuitting && process.platform === 'win32' && tray) {
    //   event.preventDefault();
    //   mainWindow.hide();
    //   return false;
    // }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== startUrl && !isDev) {
      event.preventDefault();
    }
  });
}

function createTray() {
  const trayIcon = path.join(__dirname, 'tray-icon.png');
  console.log('Tray icon path:', trayIcon);

  try {
    tray = new Tray(trayIcon);
  } catch (error) {
    console.error('Failed to create tray:', error);
    // Try with the main icon instead
    try {
      const fallbackIcon = path.join(__dirname, 'icon.png');
      console.log('Trying fallback icon:', fallbackIcon);
      tray = new Tray(fallbackIcon);
    } catch (fallbackError) {
      console.error('Failed to create tray with fallback icon:', fallbackError);
      return; // Skip tray creation if both fail
    }
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Bookmark Manager',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Add Bookmark',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('open-add-bookmark');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('open-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Bookmark Manager');
  tray.setContextMenu(contextMenu);
  
  // Double click to show window
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Add Bookmark',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('open-add-bookmark');
          }
        },
        {
          label: 'Import Bookmarks',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('open-import');
          }
        },
        {
          label: 'Export Bookmarks',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('open-export');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('open-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Search',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('focus-search');
          }
        },
        { type: 'separator' },
        {
          label: 'Analytics',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            mainWindow.webContents.send('open-analytics');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        {
          label: 'Hide to Tray',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.hide();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Bookmark Manager',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Bookmark Manager',
              message: 'Bookmark Manager',
              detail: 'A modern bookmark library manager for organizing and managing your bookmarks efficiently.',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            if (autoUpdater) {
              autoUpdater.checkForUpdatesAndNotify();
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Updates',
                message: 'Auto-updater not available',
                detail: 'Please check for updates manually.',
                buttons: ['OK']
              });
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();
  createMenu();
  
  // Auto-updater setup
  if (!isDev && autoUpdater) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  isQuitting = true;

  // Close local server if running
  if (localServer) {
    localServer.close();
    localServer = null;
  }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Auto-updater events
if (autoUpdater) {
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available.');
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.');
  });

  autoUpdater.on('error', (err) => {
    console.log('Error in auto-updater. ' + err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    autoUpdater.quitAndInstall();
  });
}
