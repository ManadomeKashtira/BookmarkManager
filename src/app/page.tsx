
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
import { PasgenModal } from '@/components/PasgenModal';
import { MemoView } from '@/components/MemoView';
import { HealthCheckModal } from '@/components/HealthCheckModal';
import { DuplicateManagementModal } from '@/components/DuplicateManagementModal';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useSettings } from '@/hooks/useSettings';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useElectron } from '@/hooks/useElectron';
import { useMemos } from '@/hooks/useMemos';
import type { Bookmark, Memo } from '@/types/bookmark';

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

  const { settings, updateSettings, updateTheme, resetSettings, restoreSettings, isInitialized: settingsInitialized } = useSettings();
  const analytics = useAnalytics(allBookmarks);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModalOpen] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPasgenModalOpen, setIsPasgenModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>();
  const [currentView, setCurrentView] = useState<'bookmarks' | 'memos'>('bookmarks');

  const [isDeleteCategoryConfirmationModalOpen, setIsDeleteCategoryConfirmationModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isLoadingCategoryDelete, setIsLoadingCategoryDelete] = useState(false);

  const [isCreateFolderConfirmationModalOpen, setIsCreateFolderConfirmationModalOpen] = useState(false);
  const [newFolderNameForConfirmation, setNewFolderNameForConfirmation] = useState<string | null>(null);
  const [autoRenameFolderPath, setAutoRenameFolderPath] = useState<string | null>(null);

  const [categoryForNewBookmark, setCategoryForNewBookmark] = useState<string | null>(null);
  
  // Health check and duplicate management modal states
  const [isHealthCheckModalOpen, setIsHealthCheckModalOpen] = useState(false);
  const [isDuplicateManagementModalOpen, setIsDuplicateManagementModalOpen] = useState(false);

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
      await addCategoryWithPath(newFolderNameForConfirmation);
      setNewFolderNameForConfirmation(null);
      setIsCreateFolderConfirmationModalOpen(false);
    }
  };

  const handleRequestCreateNewFolder = () => {
    setIsCreateFolderConfirmationModalOpen(true);
  };

  const handleRenameCategory = (oldCategoryName: string, newCategoryName: string) => {
    renameCategory(oldCategoryName, newCategoryName);
  };

  const handleDeleteCategory = (categoryName: string) => {
    if (settings.confirmDelete) {
      if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This will also delete all bookmarks in this category.`)) {
        deleteCategory(categoryName);
      }
    } else {
      deleteCategory(categoryName);
    }
  };

  const handleUpdateCategoryIcon = (categoryPath: string, iconName: string) => {
    // Find the category by path and update its icon
    const updateCategoryIcon = (categories: any[], path: string, icon: string): any[] => {
      return categories.map(cat => {
        if (cat.fullPath === path || cat.name === path) {
          return { ...cat, icon };
        }
        if (cat.children) {
          return { ...cat, children: updateCategoryIcon(cat.children, path, icon) };
        }
        return cat;
      });
    };

    // Update the categories in localStorage
    const updatedCategories = updateCategoryIcon(categories, categoryPath, iconName);
    localStorage.setItem('bookmarkCategories', JSON.stringify(updatedCategories));
    
    // Force a re-render by updating the state
    window.dispatchEvent(new Event('storage'));
  };

  const getAnimationClass = () => {
    switch (settings.theme.animation) {
      case 'none': return '';
      case 'subtle': return 'transition-all duration-200';
      case 'smooth': return 'transition-all duration-300 ease-in-out';
      case 'bouncy': return 'transition-all duration-300 ease-out';
      default: return 'transition-all duration-200';
    }
  };

  const getDensityClass = () => {
    switch (settings.theme.density) {
      case 'compact': return 'gap-3';
      case 'comfortable': return 'gap-4';
      case 'spacious': return 'gap-6';
      default: return 'gap-4';
    }
  };

  const getCardBackgroundClass = () => {
    switch (settings.theme.cardStyle) {
      case 'glass': return 'bg-card/60 backdrop-blur-md';
      case 'solid': return 'bg-card';
      case 'minimal': return 'bg-card/80 backdrop-blur-sm';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
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
          onShowPasgen={() => {
            setIsPasgenModalOpen(true);
          }}
          onShowHealthCheck={() => setIsHealthCheckModalOpen(true)}
          onShowDuplicateManagement={() => setIsDuplicateManagementModalOpen(true)}
          onUpdateBookmarkCategory={updateBookmarkCategory}
          onRequestDeleteCategoryContents={handleRequestDeleteCategoryContents}
          onRequestCreateNewFolder={handleRequestCreateNewFolder}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onUpdateCategoryIcon={handleUpdateCategoryIcon}
          onToggleCategoryExpansion={toggleCategoryExpansion}
          onAddCategoryWithPath={addCategoryWithPath}
          autoRenameFolderPath={autoRenameFolderPath}
          onAutoRenameComplete={() => setAutoRenameFolderPath(null)}
        />

        <div className="flex-1">
          {/* View Toggle */}
          <div className="flex items-center justify-center p-4 border-b border-border/20">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setCurrentView('bookmarks')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'bookmarks'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Bookmarks
              </button>
              <button
                onClick={() => setCurrentView('memos')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'memos'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Memos
              </button>
            </div>
          </div>

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
              />

              <div className="p-6">
                {isLoading ? (
                  <LoadingSpinner viewMode={viewMode} />
                ) : bookmarks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6">📚</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No bookmarks found</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
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
                      className="modern-btn modern-btn-primary px-8 py-4 text-lg"
                    >
                      Add New Bookmark
                    </button>
                  </div>
                ) : (
                  <div className={
                    viewMode === 'grid'
                      ? 'modern-grid'
                      : 'modern-list'
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
                        cardBackgroundClass="bg-white"
                        showDescriptions={settings.showDescriptions}
                        showVisitCount={settings.showVisitCount}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-6">
              <MemoView
                memos={memos}
                categories={categoryNamesForModal}
                onAddMemo={handleAddMemo}
                onUpdateMemo={updateMemo}
                onDeleteMemo={deleteMemo}
                onToggleFavorite={toggleMemoFavorite}
              />
            </div>
          )}
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
        onAddMemo={handleAddMemo}
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

      <ConfirmationModal
        isOpen={isCreateFolderConfirmationModalOpen}
        onClose={() => {
          setIsCreateFolderConfirmationModalOpen(false);
          setNewFolderNameForConfirmation(null);
        }}
        onConfirm={handleConfirmCreateFolder}
        title="Create New Folder"
        message={
          <div className="space-y-4">
            <p>Enter a name for the new folder:</p>
            <input
              type="text"
              value={newFolderNameForConfirmation || ''}
              onChange={(e) => setNewFolderNameForConfirmation(e.target.value)}
              placeholder="New Folder"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        }
        confirmText="Create Folder"
        isDestructive={false}
        isLoading={false}
      />

      <PasgenModal
        isOpen={isPasgenModalOpen}
        onClose={() => {
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
