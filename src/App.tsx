import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { BookmarkCard } from './components/BookmarkCard';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { SettingsModal } from './components/SettingsModal';
import { ImportExportModal } from './components/ImportExportModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useBookmarks } from './hooks/useBookmarks';
import { useSettings } from './hooks/useSettings';
import { useAnalytics } from './hooks/useAnalytics';
import { useElectron, useElectronMenuEvents } from './hooks/useElectron';
import { Bookmark } from './types/bookmark';

function App() {
  const {
    bookmarks,
    allBookmarks,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    isLoading,
    stats,
    addBookmark,
    importBookmarks,
    updateBookmark,
    deleteBookmark,
    toggleFavorite
  } = useBookmarks();

  const { settings, updateSettings, updateTheme, resetSettings } = useSettings();
  const analytics = useAnalytics(allBookmarks);
  const { isElectron, platform } = useElectron();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>();

  // Handle Electron menu events
  useElectronMenuEvents({
    onAddBookmark: () => setIsAddModalOpen(true),
    onImport: () => setIsImportModalOpen(true),
    onExport: () => setIsExportModalOpen(true),
    onSettings: () => setIsSettingsModalOpen(true),
    onAnalytics: () => setIsAnalyticsModalOpen(true),
    onFocusSearch: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  });

  const handleAddBookmark = (bookmarkData: Omit<Bookmark, 'id' | 'dateAdded' | 'dateModified' | 'visits'>) => {
    if (editingBookmark) {
      updateBookmark(editingBookmark.id, bookmarkData);
      setEditingBookmark(undefined);
    } else {
      addBookmark(bookmarkData);
    }
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsAddModalOpen(true);
  };

  const handleDeleteBookmark = (id: string) => {
    if (settings.confirmDelete) {
      if (window.confirm('Are you sure you want to delete this bookmark?')) {
        deleteBookmark(id);
      }
    } else {
      deleteBookmark(id);
    }
  };

  const categoryNames = categories.map(cat => cat.name);

  // Apply theme styles
  const themeStyles = {
    '--primary-color': settings.theme.primaryColor,
    '--secondary-color': settings.theme.secondaryColor,
    '--accent-color': settings.theme.accentColor,
    '--bg-color': settings.theme.backgroundColor,
  } as React.CSSProperties;

  const getAnimationClass = () => {
    switch (settings.theme.animation) {
      case 'none': return '';
      case 'subtle': return 'transition-all duration-150';
      case 'bouncy': return 'transition-all duration-300 ease-bounce';
      default: return 'transition-all duration-200';
    }
  };

  const getDensityClass = () => {
    switch (settings.theme.density) {
      case 'compact': return 'gap-3';
      case 'spacious': return 'gap-8';
      default: return 'gap-6';
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${isElectron ? 'electron-app' : 'web-app'} platform-${platform}`}
      style={themeStyles}
    >
      <div className="flex">
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          stats={stats}
          onAddBookmark={() => setIsAddModalOpen(true)}
          onShowAnalytics={() => setIsAnalyticsModalOpen(true)}
          onShowSettings={() => setIsSettingsModalOpen(true)}
          onShowImport={() => setIsImportModalOpen(true)}
          onShowExport={() => setIsExportModalOpen(true)}
        />
        
        <div className="flex-1">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedCategory={selectedCategory}
            totalResults={bookmarks.length}
            searchInputRef={searchInputRef}
          />
          
          <div className="p-6">
            {isLoading ? (
              <LoadingSpinner viewMode={viewMode} />
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookmarks found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? `No bookmarks match "${searchQuery}". Try adjusting your search.`
                    : 'Start building your bookmark library by adding your first bookmark.'
                  }
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 ${getAnimationClass()}`}
                >
                  Add Your First Bookmark
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${getDensityClass()}`
                  : `space-y-4 ${settings.theme.density === 'compact' ? 'space-y-2' : settings.theme.density === 'spacious' ? 'space-y-6' : 'space-y-4'}`
              }>
                {bookmarks.map(bookmark => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    viewMode={viewMode}
                    onToggleFavorite={toggleFavorite}
                    onEdit={handleEditBookmark}
                    onDelete={handleDeleteBookmark}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBookmark(undefined);
        }}
        onAdd={handleAddBookmark}
        categories={categoryNames}
        editingBookmark={editingBookmark}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        analytics={analytics}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onUpdateTheme={updateTheme}
        onResetSettings={resetSettings}
      />

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        bookmarks={allBookmarks}
        onImportBookmarks={importBookmarks}
        mode="import"
      />

      <ImportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        bookmarks={allBookmarks}
        onImportBookmarks={importBookmarks}
        mode="export"
      />
    </div>
  );
}

export default App;