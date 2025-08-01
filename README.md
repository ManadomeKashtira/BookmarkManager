# 📚 Bookmark Manager Desktop

A modern, feature-rich bookmark management application built with React, Next.js, and Electron. Organize, search, and manage your bookmarks with a beautiful, intuitive interface.

![Bookmark Manager](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ Features

### 🎯 Core Features
- **Smart Organization**: Create hierarchical categories with custom colors
- **Advanced Search**: Find bookmarks instantly with powerful search functionality
- **Multiple View Modes**: Switch between grid and list views
- **Favorites System**: Mark important bookmarks for quick access
- **Visit Tracking**: Monitor bookmark usage with visit counters
- **Tags Support**: Organize bookmarks with custom tags

### 📊 Analytics & Insights
- **Usage Analytics**: Track bookmark activity and trends
- **Category Distribution**: Visual breakdown of your bookmark collection
- **Visit Statistics**: See your most accessed bookmarks
- **Activity Trends**: Monitor your bookmarking patterns over time

### 🎨 Customization
- **Theme System**: Customize colors, animations, and density
- **Multiple Card Styles**: Choose from glass, solid, or minimal designs
- **Flexible Layouts**: Adjust spacing and visual density
- **Animation Controls**: From subtle to bouncy animations

### 💾 Data Management
- **Import/Export**: Backup and restore your bookmarks
- **Multiple Formats**: Support for various bookmark formats
- **Auto-backup**: Automatic data protection (coming soon)
- **Cross-platform Sync**: Keep bookmarks synchronized across devices

### 🖥️ Desktop Integration
- **Native Menus**: Full Electron menu integration
- **Keyboard Shortcuts**: Quick access to all features
- **System Tray**: Minimize to system tray
- **Auto-updater**: Seamless application updates

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Python** (for some build dependencies)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bookmark-manager/bookmark-manager-desktop.git
   cd bookmark-manager-desktop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**

   **Development Mode:**
   ```bash
   # Web version
   npm run dev
   
   # Desktop version (Electron)
   npm run electron-dev
   ```

   **Production Mode:**
   ```bash
   # Build the application
   npm run build
   
   # Run desktop version
   npm run electron
   ```

### Building for Distribution

**Windows:**
```bash
npm run dist-win
```

**All Platforms:**
```bash
npm run dist
```

Built applications will be available in the `final-build` directory.

## 📖 How to Use

### Getting Started
1. **Launch the application** using one of the methods above
2. **Add your first bookmark** by clicking the "+" button or using Ctrl+N
3. **Create categories** to organize your bookmarks
4. **Use the search bar** to quickly find specific bookmarks

### Managing Bookmarks

#### Adding Bookmarks
- Click the **"Add Bookmark"** button in the sidebar
- Use the keyboard shortcut **Ctrl+N** (Cmd+N on Mac)
- Fill in the URL, title, description, and select a category
- Add tags for better organization

#### Organizing with Categories
- Create **hierarchical categories** (e.g., Work → Projects → Web Development)
- Assign **custom colors** to categories for visual organization
- Use the **tree view** in the sidebar to navigate categories

#### Search and Filter
- Use the **search bar** to find bookmarks by title, URL, or description
- **Filter by category** using the sidebar
- **Sort bookmarks** by date, title, visits, or favorites

### Advanced Features

#### Analytics Dashboard
- Access via the **Analytics** button in the sidebar
- View **usage statistics** and **activity trends**
- See **category distribution** and **most visited bookmarks**

#### Customization
- Open **Settings** to customize the appearance
- Choose from different **themes and color schemes**
- Adjust **animation speed** and **layout density**
- Select preferred **card styles** and **view modes**

#### Import/Export
- **Import bookmarks** from browsers or other bookmark managers
- **Export your collection** for backup or sharing
- Support for **JSON and HTML formats**

### Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Add Bookmark | Ctrl+N | Cmd+N |
| Search | Ctrl+F | Cmd+F |
| Settings | Ctrl+, | Cmd+, |
| Import | Ctrl+I | Cmd+I |
| Export | Ctrl+E | Cmd+E |
| Analytics | Ctrl+A | Cmd+A |

## 🛠️ Development

### Project Structure
```
bookmark-manager-desktop/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── lib/                # Utility functions
│   └── app/                # Next.js app directory
├── public/                 # Static assets and Electron files
├── final-build/           # Built application output
└── package.json           # Project configuration
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (web) |
| `npm run build` | Build for production |
| `npm run electron-dev` | Start Electron in development |
| `npm run electron` | Run Electron in production |
| `npm run dist` | Build distributable packages |
| `npm run lint` | Run ESLint |

### Tech Stack
- **Frontend**: React 19, Next.js 15, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Desktop**: Electron 28
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Build Tools**: Electron Builder

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: [Create an issue](https://github.com/bookmark-manager/bookmark-manager-desktop/issues)
- **Feature Requests**: [Start a discussion](https://github.com/bookmark-manager/bookmark-manager-desktop/discussions)

## 📞 Support

- **Email**: support@bookmarkmanager.com
- **Documentation**: [Wiki](https://github.com/bookmark-manager/bookmark-manager-desktop/wiki)
- **Community**: [Discussions](https://github.com/bookmark-manager/bookmark-manager-desktop/discussions)

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/)
- UI components powered by [React](https://reactjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ by the Bookmark Manager Team**
