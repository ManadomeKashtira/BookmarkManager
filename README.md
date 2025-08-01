# 📚 Bookmark Manager Desktop / Web App

bookmark management application built with React, Next.js, and Electron.

![Bookmark Manager](https://img.shields.io/badge/version-1.0.0-blue.svg)

Core Features
- **Smart Organization**: Create hierarchical categories with custom colors
- **Advanced Search**: Find bookmarks instantly with powerful search functionality
- **Multiple View Modes**: Switch between grid and list views
- **Favorites System**: Mark important bookmarks for quick access
- **Visit Tracking**: Monitor bookmark usage with visit counters
- **Tags Support**: Organize bookmarks with custom tags

## Analytics & Insights
- **Usage Analytics**: Track bookmark activity and trends
- **Category Distribution**: Visual breakdown of your bookmark collection
- **Visit Statistics**: See your most accessed bookmarks
- **Activity Trends**: Monitor your bookmarking patterns over time

## Data Management
- **Import/Export**: Backup and restore your bookmarks
- **Multiple Formats**: Support for various bookmark formats
- **Auto-backup**: Automatic data protection (coming soon)

## Quick Start

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
   npm run build
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


| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (web) |
| `npm run build` | Build for production |
| `npm run electron-dev` | Start Electron in development |
| `npm run electron` | Run Electron in production |
| `npm run dist` | Build distributable packages |
| `npm run lint` | Run ESLint |

**Made with ❤️ by Open source comunity**
