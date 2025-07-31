const { app, shell, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

class WindowsIntegration {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupWindowsFeatures();
  }

  setupWindowsFeatures() {
    if (process.platform !== 'win32') return;

    // Set up protocol handler for bookmark:// URLs
    this.setupProtocolHandler();
    
    // Set up file associations
    this.setupFileAssociations();
    
    // Set up Windows notifications
    this.setupNotifications();
    
    // Set up Windows taskbar integration
    this.setupTaskbarIntegration();
  }

  setupProtocolHandler() {
    // Register protocol handler for bookmark:// URLs
    if (!app.isDefaultProtocolClient('bookmark')) {
      app.setAsDefaultProtocolClient('bookmark');
    }

    // Handle protocol URLs
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleProtocolUrl(url);
    });

    // Handle protocol URLs on Windows (second-instance)
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, focus our window instead
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }

      // Check for protocol URL in command line
      const protocolUrl = commandLine.find(arg => arg.startsWith('bookmark://'));
      if (protocolUrl) {
        this.handleProtocolUrl(protocolUrl);
      }
    });
  }

  handleProtocolUrl(url) {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.protocol === 'bookmark:') {
        // Show main window
        if (this.mainWindow) {
          this.mainWindow.show();
          this.mainWindow.focus();
        }

        // Handle different bookmark protocol actions
        switch (urlObj.hostname) {
          case 'add':
            // bookmark://add?url=https://example.com&title=Example
            const urlParam = urlObj.searchParams.get('url');
            const titleParam = urlObj.searchParams.get('title');
            if (urlParam) {
              this.mainWindow.webContents.send('add-bookmark-from-protocol', {
                url: urlParam,
                title: titleParam || ''
              });
            }
            break;
          case 'search':
            // bookmark://search?q=searchterm
            const query = urlObj.searchParams.get('q');
            if (query) {
              this.mainWindow.webContents.send('search-from-protocol', query);
            }
            break;
          default:
            // Just show the app
            break;
        }
      }
    } catch (error) {
      console.error('Error handling protocol URL:', error);
    }
  }

  setupFileAssociations() {
    // Register file associations for bookmark files
    const bookmarkExtensions = ['.bookmarks', '.bmk'];
    
    bookmarkExtensions.forEach(ext => {
      if (!app.isDefaultProtocolClient(ext.slice(1))) {
        // Note: This requires admin privileges on Windows
        // In production, this would be handled by the installer
        try {
          app.setAsDefaultProtocolClient(ext.slice(1));
        } catch (error) {
          console.log(`Could not set default handler for ${ext}:`, error.message);
        }
      }
    });
  }

  setupNotifications() {
    // Check if notifications are supported
    if (!Notification.isSupported()) {
      console.log('Notifications are not supported on this system');
      return;
    }

    // Show welcome notification on first run
    const isFirstRun = !fs.existsSync(path.join(app.getPath('userData'), 'settings.json'));
    if (isFirstRun) {
      setTimeout(() => {
        new Notification({
          title: 'Welcome to Bookmark Manager!',
          body: 'Your bookmarks are now organized and accessible from your desktop.',
          icon: path.join(__dirname, 'icon.png')
        }).show();
      }, 3000);
    }
  }

  setupTaskbarIntegration() {
    // Set up Windows taskbar features
    if (process.platform === 'win32') {
      // Set taskbar progress (can be used for import/export operations)
      this.setTaskbarProgress = (progress) => {
        if (this.mainWindow) {
          this.mainWindow.setProgressBar(progress);
        }
      };

      // Set up jump list (Windows taskbar right-click menu)
      this.setupJumpList();
    }
  }

  setupJumpList() {
    const jumpList = [
      {
        type: 'custom',
        name: 'Quick Actions',
        items: [
          {
            type: 'task',
            title: 'Add New Bookmark',
            description: 'Quickly add a new bookmark',
            program: process.execPath,
            args: '--add-bookmark',
            iconPath: process.execPath,
            iconIndex: 0
          },
          {
            type: 'task',
            title: 'Search Bookmarks',
            description: 'Search through your bookmarks',
            program: process.execPath,
            args: '--search',
            iconPath: process.execPath,
            iconIndex: 0
          }
        ]
      }
    ];

    app.setJumpList(jumpList);
  }

  // Method to show Windows toast notification
  showNotification(title, body, options = {}) {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: options.icon || path.join(__dirname, 'icon.png'),
        silent: options.silent || false,
        ...options
      });

      notification.show();
      return notification;
    }
    return null;
  }

  // Method to update taskbar progress
  updateTaskbarProgress(progress) {
    if (this.mainWindow && process.platform === 'win32') {
      this.mainWindow.setProgressBar(progress);
    }
  }

  // Method to clear taskbar progress
  clearTaskbarProgress() {
    if (this.mainWindow && process.platform === 'win32') {
      this.mainWindow.setProgressBar(-1);
    }
  }

  // Method to set taskbar overlay icon
  setTaskbarOverlay(icon, description) {
    if (this.mainWindow && process.platform === 'win32') {
      this.mainWindow.setOverlayIcon(icon, description);
    }
  }
}

module.exports = WindowsIntegration;
