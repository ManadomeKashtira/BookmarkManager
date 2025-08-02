import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { BookmarkCard } from './components/BookmarkCard';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { SettingsModal } from './components/SettingsModal';
import { ImportExportModal } from './components/ImportExportModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PasgenModal } from './components/PasgenModal';
import { HealthCheckModal } from './components/HealthCheckModal';
import { DuplicateManagementModal } from './components/DuplicateManagementModal';
import { MemoView } from './components/MemoView';
import { useBookmarks } from './hooks/useBookmarks';
import { useSettings } from './hooks/useSettings';
import { useAnalytics } from './hooks/useAnalytics';
import { useMemos } from './hooks/useMemos';
import { useElectron, useElectronMenuEvents } from './hooks/useElectron';
import { Bookmark, Memo } from './types/bookmark';

function App() {
  const {
    bookmarks,
    allBookmarks,
    categories,
    categoryTree,
    visibleCategories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    healthFilter,
    setHealthFilter,
    isLoading,
    stats,
    addBookmark,
    importBookmarks,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    updateBookmarkCategory,
    deleteBookmarksByCategory,
    addCategoryWithPath,
    renameCategory,
    deleteCategory,
    updateCategoryIcon,
    toggleCategoryExpansion
  } = useBookmarks();

  const { settings, updateSettings, updateTheme, resetSettings } = useSettings();
  const analytics = useAnalytics(allBookmarks);
  const { isElectron, platform } = useElectron();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Memo functionality
  const {
    memos,
    loading: memosLoading,
    addMemo,
    updateMemo,
    deleteMemo,
    toggleFavorite: toggleMemoFavorite,
    importMemos
  } = useMemos();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPasgenModalOpen, setIsPasgenModalOpen] = useState(false);
  const [isHealthCheckModalOpen, setIsHealthCheckModalOpen] = useState(false);
  const [isDuplicateManagementModalOpen, setIsDuplicateManagementModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'bookmarks' | 'memos'>('bookmarks');
  
  // Debug state changes
  console.log('App.tsx: isPasgenModalOpen state:', isPasgenModalOpen); // Debug log
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

  const handleAddMemo = (memoData: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    addMemo(memoData);
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
          categoryTree={categoryTree}
          visibleCategories={visibleCategories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          stats={stats}
          currentView={currentView}
          onViewChange={setCurrentView}
          onAddBookmark={() => setIsAddModalOpen(true)}
          onShowAnalytics={() => setIsAnalyticsModalOpen(true)}
          onShowSettings={() => setIsSettingsModalOpen(true)}
          onShowImport={() => setIsImportModalOpen(true)}
          onShowExport={() => setIsExportModalOpen(true)}
          onShowPasgen={() => {
            console.log('App.tsx: onShowPasgen called, setting isPasgenModalOpen to true'); // Debug log
            setIsPasgenModalOpen(true);
          }}
          onShowHealthCheck={() => setIsHealthCheckModalOpen(true)}
          onShowDuplicateManagement={() => setIsDuplicateManagementModalOpen(true)}
          onUpdateBookmarkCategory={updateBookmarkCategory}
          onRequestDeleteCategoryContents={deleteBookmarksByCategory}
          onRequestCreateNewFolder={() => {
            const folderName = prompt('Enter folder name:');
            if (folderName && folderName.trim()) {
              addCategoryWithPath(folderName.trim());
            }
          }}
          onRenameCategory={renameCategory}
          onDeleteCategory={deleteCategory}
          onUpdateCategoryIcon={updateCategoryIcon}
          onToggleCategoryExpansion={toggleCategoryExpansion}
          onAddCategoryWithPath={addCategoryWithPath}
        />
        
        <div className="flex-1">
          {currentView === 'bookmarks' ? (
            <>
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
                healthFilter={healthFilter}
                onHealthFilterChange={setHealthFilter}
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
                        onVisit={(bookmark) => {
                          // Handle visit logic here
                          window.open(bookmark.url, '_blank');
                        }}
                        cardBackgroundClass="bg-card hover:bg-card/80"
                        showDescriptions={settings.showDescriptions}
                        showVisitCount={settings.showVisitCount}
                        showHealthStatus={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <MemoView
              memos={memos}
              categories={categoryNames}
              onAddMemo={handleAddMemo}
              onUpdateMemo={updateMemo}
              onDeleteMemo={deleteMemo}
              onToggleFavorite={toggleMemoFavorite}
            />
          )}
        </div>
      </div>

      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBookmark(undefined);
        }}
        onAdd={handleAddBookmark}
        onAddMemo={handleAddMemo}
        onUpdateBookmark={updateBookmark}
        onDeleteBookmark={deleteBookmark}
        categories={categoryNames}
        editingBookmark={editingBookmark}
        allBookmarks={allBookmarks}
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
        onDeleteAllData={() => {
          if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
            // Handle delete all data logic
            console.log('Delete all data');
          }
        }}
      />

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        bookmarks={allBookmarks}
        categories={categories}
        settings={settings}
        userPreferences={{
          selectedCategory,
          searchQuery,
          viewMode,
          sortBy
        }}
        memos={memos}
        onImportBookmarks={importBookmarks}
        onImportMemos={importMemos}
        onRestoreCompleteBackup={(backupData) => {
          // Handle complete backup restoration
          if (backupData.memos) {
            importMemos(backupData.memos);
          }
          console.log('Restore complete backup', backupData);
        }}
        mode="import"
      />

      <ImportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        bookmarks={allBookmarks}
        categories={categories}
        settings={settings}
        userPreferences={{
          selectedCategory,
          searchQuery,
          viewMode,
          sortBy
        }}
        memos={memos}
        onImportBookmarks={importBookmarks}
        onImportMemos={importMemos}
        onRestoreCompleteBackup={(backupData) => {
          // Handle complete backup restoration
          if (backupData.memos) {
            importMemos(backupData.memos);
          }
          console.log('Restore complete backup', backupData);
        }}
        mode="export"
      />

      <PasgenModal
        isOpen={isPasgenModalOpen}
        onClose={() => {
          console.log('PasgenModal onClose called'); // Debug log
          setIsPasgenModalOpen(false);
        }}
      />

      <HealthCheckModal
        isOpen={isHealthCheckModalOpen}
        onClose={() => setIsHealthCheckModalOpen(false)}
        bookmarks={allBookmarks}
        onUpdateBookmark={updateBookmark}
        onDeleteBookmark={deleteBookmark}
      />

      <DuplicateManagementModal
        isOpen={isDuplicateManagementModalOpen}
        onClose={() => setIsDuplicateManagementModalOpen(false)}
        bookmarks={allBookmarks}
        onUpdateBookmark={updateBookmark}
        onDeleteBookmark={deleteBookmark}
      />
    </div>
  );
}

export default App;