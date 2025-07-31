
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { BookmarkCard } from '@/components/BookmarkCard';
import { AddBookmarkModal } from '@/components/AddBookmarkModal';
import { AnalyticsModal } from '@/components/AnalyticsModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ImportExportModal } from '@/components/ImportExportModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useSettings } from '@/hooks/useSettings';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { Bookmark } from '@/types/bookmark';

export default function HomePage() {
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
    isLoading,
    stats,
    addCategory,
    addCategoryWithPath,
    addBookmark,
    importBookmarks: handleImportBookmarks,
    updateBookmark,
    deleteBookmark,
    deleteAllBookmarks,
    toggleFavorite,
    incrementVisitCount,
    updateBookmarkCategory,
    deleteBookmarksByCategory,
    renameCategory,
    deleteCategory,
    restoreCompleteBackup,
    toggleCategoryExpansion,
  } = useBookmarks();

  const { settings, updateSettings, updateTheme, resetSettings, restoreSettings, isInitialized: settingsInitialized } = useSettings();
  const analytics = useAnalytics(allBookmarks);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModalOpen] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>();

  const [isDeleteCategoryConfirmationModalOpen, setIsDeleteCategoryConfirmationModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isLoadingCategoryDelete, setIsLoadingCategoryDelete] = useState(false);

  const [isCreateFolderConfirmationModalOpen, setIsCreateFolderConfirmationModalOpen] = useState(false);
  const [newFolderNameForConfirmation, setNewFolderNameForConfirmation] = useState<string | null>(null);
  const [autoRenameFolderPath, setAutoRenameFolderPath] = useState<string | null>(null);

  const [categoryForNewBookmark, setCategoryForNewBookmark] = useState<string | null>(null);

  const categoryNamesForModal = useMemo(() => categories.map(cat => cat.name), [categories]);

  const handleAddOrUpdateBookmark = (bookmarkData: Omit<Bookmark, 'id' | 'dateAdded' | 'dateModified' | 'visits'>) => {
    if (editingBookmark) {
      updateBookmark(editingBookmark.id, bookmarkData);
      setEditingBookmark(undefined);
    } else {
      addBookmark(bookmarkData);
    }
    setIsAddModalOpen(false);
    setCategoryForNewBookmark(null);
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

  const handleVisitBookmark = (bookmark: Bookmark) => {
    incrementVisitCount(bookmark.id);
    window.open(bookmark.url, '_blank');
  };

  const handleRequestDeleteAllData = () => {
    setIsDeleteConfirmationModalOpen(true);
  };

  const handleConfirmDeleteAllData = async () => {
    setIsLoadingDelete(true);
    await deleteAllBookmarks();
    setIsLoadingDelete(false);
    setIsDeleteConfirmationModalOpen(false);
  };

  const handleRequestDeleteCategoryContents = (categoryName: string) => {
    setCategoryToDelete(categoryName);
    setIsDeleteCategoryConfirmationModalOpen(true);
  };

  const handleConfirmDeleteCategoryContents = async () => {
    if (categoryToDelete) {
      setIsLoadingCategoryDelete(true);
      await deleteBookmarksByCategory(categoryToDelete);
      setIsLoadingCategoryDelete(false);
      setIsDeleteCategoryConfirmationModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleConfirmCreateFolder = async () => {
    if (newFolderNameForConfirmation) {
      addCategory(newFolderNameForConfirmation);
      setCategoryForNewBookmark(newFolderNameForConfirmation);
      setIsAddModalOpen(true);
    }
    setIsCreateFolderConfirmationModalOpen(false);
    setNewFolderNameForConfirmation(null);
  };

  const handleRequestCreateNewFolder = () => {
    const defaultFolderName = "New Folder";
    let fullPath = defaultFolderName;
    if (selectedCategory && !['All', 'Favorites', 'Recent'].includes(selectedCategory)) {
      fullPath = `${selectedCategory}/${defaultFolderName}`;
    }
    const result = addCategoryWithPath(fullPath, { autoRename: true });
    if (result) {
      setAutoRenameFolderPath(result.path);
      setSelectedCategory(result.path);
    }
  };

  const handleRenameCategory = (oldCategoryName: string, newCategoryName: string) => {
    renameCategory(oldCategoryName, newCategoryName);
  };

  const handleDeleteCategory = (categoryName: string) => {
    deleteCategory(categoryName);
  };

  const pageStyle: React.CSSProperties = settingsInitialized ? {
    '--theme-primary-color': settings.theme.primaryColor,
    '--theme-secondary-color': settings.theme.secondaryColor,
    '--theme-accent-color': settings.theme.accentColor,
    '--theme-bg-color': settings.theme.backgroundColor,
  } : {};

  const getAnimationClass = () => {
    if (!settingsInitialized) return '';
    switch (settings.theme.animation) {
      case 'none': return '';
      case 'subtle': return 'transition-all duration-150';
      case 'bouncy': return 'transition-all duration-300 ease-bounce';
      default: return 'transition-all duration-200';
    }
  };

  const getDensityClass = () => {
    if (!settingsInitialized) return 'gap-6';
    switch (settings.theme.density) {
      case 'compact': return 'gap-3';
      case 'spacious': return 'gap-8';
      default: return 'gap-6';
    }
  };

  const getCardBackgroundClass = () => {
    if (!settingsInitialized) return 'bg-white/80 backdrop-blur-sm';
    switch (settings.theme.cardStyle) {
        case 'glass': return 'bg-card/80 backdrop-blur-sm';
        case 'solid': return 'bg-card';
        case 'minimal': return 'bg-transparent';
        default: return 'bg-card/80 backdrop-blur-sm';
    }
  };

  if (!settingsInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary">Loading application...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={pageStyle}
    >
      <div className="flex">
        <Sidebar
          categories={categories}
          categoryTree={categoryTree}
          visibleCategories={visibleCategories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          stats={stats}
          onAddBookmark={() => {
            setCategoryForNewBookmark(selectedCategory && !['All', 'Favorites', 'Recent'].includes(selectedCategory) ? selectedCategory : null);
            setIsAddModalOpen(true);
          }}
          onShowAnalytics={() => setIsAnalyticsModalOpen(true)}
          onShowSettings={() => setIsSettingsModalOpen(true)}
          onShowImport={() => setIsImportModalOpen(true)}
          onShowExport={() => setIsExportModalOpen(true)}
          onUpdateBookmarkCategory={updateBookmarkCategory}
          onRequestDeleteCategoryContents={handleRequestDeleteCategoryContents}
          onRequestCreateNewFolder={handleRequestCreateNewFolder}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onToggleCategoryExpansion={toggleCategoryExpansion}
          onAddCategoryWithPath={addCategoryWithPath}
          autoRenameFolderPath={autoRenameFolderPath}
          onAutoRenameComplete={() => setAutoRenameFolderPath(null)}
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
          />

          <div className="p-6">
            {isLoading ? (
              <LoadingSpinner viewMode={viewMode} />
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No bookmarks found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? `No bookmarks match "${searchQuery}". Try adjusting your search.`
                    : selectedCategory !== "All"
                        ? `No bookmarks in "${selectedCategory}". Add some or switch categories.`
                        : 'Start building your bookmark library by adding your first bookmark.'
                  }
                </p>
                <button
                  onClick={() => {
                    setCategoryForNewBookmark(selectedCategory && !['All', 'Favorites', 'Recent'].includes(selectedCategory) ? selectedCategory : null);
                    setIsAddModalOpen(true);
                  }}
                  className={`bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 hover:scale-105 hover:shadow-lg ${getAnimationClass()}`}
                >
                  Add New Bookmark
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
                    onVisit={handleVisitBookmark}
                    cardBackgroundClass={getCardBackgroundClass()}
                    showDescriptions={settings.showDescriptions}
                    showVisitCount={settings.showVisitCount}
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
          setCategoryForNewBookmark(null);
        }}
        onAdd={handleAddOrUpdateBookmark}
        categories={categoryNamesForModal}
        editingBookmark={editingBookmark}
        initialCategory={categoryForNewBookmark}
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
        onDeleteAllData={handleRequestDeleteAllData}
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
        onImportBookmarks={handleImportBookmarks}
        onRestoreCompleteBackup={(backupData) => {
          restoreCompleteBackup(backupData);
          restoreSettings(backupData.settings);
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
        onImportBookmarks={handleImportBookmarks}
        onRestoreCompleteBackup={(backupData) => {
          restoreCompleteBackup(backupData);
          restoreSettings(backupData.settings);
        }}
        mode="export"
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmationModalOpen}
        onClose={() => setIsDeleteConfirmationModalOpen(false)}
        onConfirm={handleConfirmDeleteAllData}
        title="Confirm Deletion"
        message="Are you absolutely sure you want to delete ALL bookmarks? This action cannot be undone."
        confirmText="Delete All"
        isDestructive={true}
        isLoading={isLoadingDelete}
      />

      <ConfirmationModal
        isOpen={isDeleteCategoryConfirmationModalOpen}
        onClose={() => {
          setIsDeleteCategoryConfirmationModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDeleteCategoryContents}
        title={`Delete Bookmarks in "${categoryToDelete || ''}"`}
        message={`Are you sure you want to delete all bookmarks in the category "${categoryToDelete || ''}"? This action cannot be undone.`}
        confirmText="Delete Category Bookmarks"
        isDestructive={true}
        isLoading={isLoadingCategoryDelete}
      />
    </div>
  );
}
