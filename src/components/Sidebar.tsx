
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bookmark as BookmarkIconLucide,
  Heart,
  Clock,
  FolderOpen,
  Plus,
  BarChart3,
  Settings,
  Download,
  Upload,
  BookOpen,
  Trash2 as TrashIcon,
  FolderPlus,
  Edit,
  ChevronRight,
  ChevronDown,
  Folder,
  Shield,
  FileText
} from 'lucide-react';
import type { Category, BookmarkStats } from '@/types/bookmark';
import { TreeCategoryItem } from './TreeCategoryItem';

interface SidebarProps {
  categories: Category[];
  categoryTree: Category[];
  visibleCategories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  stats: BookmarkStats;
  currentView?: 'bookmarks' | 'memos';
  onViewChange?: (view: 'bookmarks' | 'memos') => void;
  onAddBookmark: () => void;
  onShowAnalytics: () => void;
  onShowSettings: () => void;
  onShowImport: () => void;
  onShowExport: () => void;
  onShowPasgen: () => void;
  onUpdateBookmarkCategory: (bookmarkId: string, newCategoryName: string) => void;
  onRequestDeleteCategoryContents: (categoryName: string) => void;
  onRequestCreateNewFolder: () => void;
  onRenameCategory: (oldCategoryName: string, newCategoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onToggleCategoryExpansion: (categoryPath: string) => void;
  onAddCategoryWithPath: (categoryPath: string, options?: { autoRename?: boolean }) => any;
  autoRenameFolderPath?: string | null;
  onAutoRenameComplete?: () => void;
}

const CREATE_NEW_FOLDER_CONTEXT_KEY = 'CREATE_NEW_FOLDER_CONTEXT';

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  categoryTree,
  visibleCategories,
  selectedCategory,
  onCategorySelect,
  stats,
  currentView = 'bookmarks',
  onViewChange,
  onAddBookmark,
  onShowAnalytics,
  onShowSettings,
  onShowImport,
  onShowExport,
  onShowPasgen,
  onUpdateBookmarkCategory,
  onRequestDeleteCategoryContents,
  onRequestCreateNewFolder,
  onRenameCategory,
  onDeleteCategory,
  onToggleCategoryExpansion,
  onAddCategoryWithPath,
  autoRenameFolderPath,
  onAutoRenameComplete,
}) => {
  const menuItems = [
    { id: 'All', label: 'All Bookmarks', icon: BookOpen, count: stats.total },
    { id: 'Favorites', label: 'Favorites', icon: Heart, count: stats.favorites },
    { id: 'Recent', label: 'Recently Added', icon: Clock, count: stats.recentlyAdded }
  ];

  const [draggedOverCategory, setDraggedOverCategory] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    categoryName: string | null;
  }>({ visible: false, x: 0, y: 0, categoryName: null });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, categoryName: null });
  }, []);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible, closeContextMenu]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCategory && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCategory]);

  // Clear editing state if the category being edited no longer exists
  useEffect(() => {
    if (editingCategory && !categories.some(cat => cat.name === editingCategory)) {
      setEditingCategory(null);
      setEditingValue('');
    }
  }, [categories, editingCategory]);

  const toggleFolder = useCallback((categoryName: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  }, []);

  // Helper function to check if a category should be visible
  const isCategoryVisible = useCallback((categoryName: string) => {
    const parts = categoryName.split('/');
    if (parts.length === 1) return true; // Root level always visible

    // Check if all parent folders are expanded
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('/');
      if (!expandedFolders.has(parentPath)) {
        return false;
      }
    }
    return true;
  }, [expandedFolders]);

  // Helper function to get the display name and depth
  const getCategoryDisplayInfo = useCallback((categoryName: string) => {
    const parts = categoryName.split('/');
    return {
      displayName: parts[parts.length - 1],
      depth: parts.length - 1,
      hasChildren: categories.some(cat => cat.name.startsWith(categoryName + '/') && cat.name.split('/').length === parts.length + 1),
      isExpanded: expandedFolders.has(categoryName)
    };
  }, [categories, expandedFolders]);

  // Auto-expand parent folders when a category is selected
  useEffect(() => {
    if (selectedCategory && !['All', 'Favorites', 'Recent'].includes(selectedCategory)) {
      const parts = selectedCategory.split('/');
      if (parts.length > 1) {
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          // Expand all parent folders
          for (let i = 1; i < parts.length; i++) {
            const parentPath = parts.slice(0, i).join('/');
            newSet.add(parentPath);
          }
          return newSet;
        });
      }
    }
  }, [selectedCategory]);


  const handleDragOver = (e: React.DragEvent, categoryName: string) => {
    e.preventDefault();
    setDraggedOverCategory(categoryName);
  };

  const handleDragLeave = () => {
    setDraggedOverCategory(null);
  };

  const handleDrop = (e: React.DragEvent, categoryName: string) => {
    e.preventDefault();
    const bookmarkId = e.dataTransfer.getData('bookmarkId');
    if (bookmarkId && categoryName) {
      // Use the full path for hierarchical categories
      onUpdateBookmarkCategory(bookmarkId, categoryName);
    }
    setDraggedOverCategory(null);
  };

  const handleContextMenuAction = (e: React.MouseEvent, categoryName: string | null) => {
    e.preventDefault();
    
    if (categoryName && ['All', 'Favorites', 'Recent'].includes(categoryName)) {
       return; // No context menu for these special items
    }

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      categoryName: categoryName, // This can be null if right-clicking the general area
    });
  };

  const handleDeleteCategoryContents = () => {
    if (contextMenu.categoryName && contextMenu.categoryName !== CREATE_NEW_FOLDER_CONTEXT_KEY) {
      onRequestDeleteCategoryContents(contextMenu.categoryName);
    }
    closeContextMenu();
  };

  const handleCreateNewFolderFromContextMenu = () => {
    onRequestCreateNewFolder();
    closeContextMenu();
  };

  const handleCreateSubfolder = (parentPath: string) => {
    const subfolderName = prompt(`Enter name for new subfolder in "${parentPath}":`);
    if (subfolderName && subfolderName.trim()) {
      const fullPath = `${parentPath}/${subfolderName.trim()}`;
      onAddCategoryWithPath(fullPath);
    }
  };

  // Render hierarchical category tree
  const renderCategoryTree = (categories: Category[]): React.ReactNode => {
    return categories.map(category => (
      <TreeCategoryItem
        key={category.id}
        category={category}
        isSelected={selectedCategory === (category.fullPath || category.name)}
        level={category.level || 0}
        onSelect={onCategorySelect}
        onToggleExpansion={onToggleCategoryExpansion}
        onRename={(oldPath, newName) => {
          // For tree items, preserve the hierarchy position
          const pathParts = oldPath.split('/');
          const parentParts = pathParts.slice(0, -1);
          const newPath = parentParts.length > 0 ? `${parentParts.join('/')}/${newName}` : newName;
          onRenameCategory(oldPath, newPath);
        }}
        onDelete={onDeleteCategory}
        onCreateSubfolder={handleCreateSubfolder}
        autoRename={autoRenameFolderPath === (category.fullPath || category.name)}
        onAutoRenameComplete={onAutoRenameComplete}
        // Drag and drop props
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        draggedOverCategory={draggedOverCategory}
      >
        {category.children && category.children.length > 0 && (
          renderCategoryTree(category.children)
        )}
      </TreeCategoryItem>
    ));
  };

  const handleRenameCategory = () => {
    if (contextMenu.categoryName && contextMenu.categoryName !== CREATE_NEW_FOLDER_CONTEXT_KEY) {
      // Start Windows-like inline editing
      setEditingCategory(contextMenu.categoryName);
      setEditingValue(contextMenu.categoryName);
    }
    closeContextMenu();
  };

  const handleDeleteCategory = () => {
    if (contextMenu.categoryName && contextMenu.categoryName !== CREATE_NEW_FOLDER_CONTEXT_KEY) {
      onDeleteCategory(contextMenu.categoryName);
    }
    closeContextMenu();
  };

  const startEditing = (categoryName: string, initialValue: string = categoryName) => {
    setEditingCategory(categoryName);
    setEditingValue(initialValue);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);
  };

  const finishEditing = () => {
    try {
      if (editingCategory && editingValue.trim()) {
        if (editingValue.trim() !== editingCategory) {
          onRenameCategory(editingCategory, editingValue.trim());
        }
      }
    } catch (error) {
      console.error('Error renaming category:', error);
    } finally {
      // Always clear editing state
      setEditingCategory(null);
      setEditingValue('');
    }
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingValue('');
  };



  return (
    <div className="modern-sidebar w-80 h-screen flex flex-col p-6 modern-scrollbar">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            {currentView === 'bookmarks' ? (
              <BookmarkIconLucide className="w-6 h-6 text-white" />
            ) : (
              <FileText className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {currentView === 'bookmarks' ? 'Bookmarks' : 'Memos'}
            </h1>
            <p className="text-sm text-gray-500">
              {currentView === 'bookmarks' ? 'Organize your web' : 'Rich text notes'}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        {onViewChange && (
          <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => onViewChange('bookmarks')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'bookmarks'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookmarkIconLucide className="w-4 h-4 inline mr-2" />
              Bookmarks
            </button>
            <button
              onClick={() => onViewChange('memos')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'memos'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Memos
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {currentView === 'bookmarks' ? (
            <>
              <button
                onClick={onAddBookmark}
                className="modern-btn modern-btn-primary w-full"
              >
                <Plus className="w-4 h-4" />
                Add Bookmark
              </button>
              <button
                onClick={onRequestCreateNewFolder}
                className="modern-btn modern-btn-secondary w-full"
              >
                <FolderPlus className="w-4 h-4" />
                Create Folder
              </button>
            </>
          ) : (
            <button
              onClick={onAddBookmark}
              className="modern-btn modern-btn-primary w-full"
            >
              <Plus className="w-4 h-4" />
              Add Memo
            </button>
          )}
          <button
            onClick={onShowPasgen}
            className="modern-btn w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-500/25"
          >
            <Shield className="w-4 h-4" />
            Pasgen
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="space-y-2 mb-6">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onCategorySelect(item.id)}
            className={`modern-sidebar-item w-full ${
              selectedCategory === item.id ? 'modern-sidebar-item active' : ''
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.label}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              selectedCategory === item.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Categories Section - Only show for bookmarks */}
      {currentView === 'bookmarks' && (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Categories</h3>
          </div>

        {/* Breadcrumb Navigation */}
        {selectedCategory && !['All', 'Favorites', 'Recent'].includes(selectedCategory) && (
          <div className="mb-4 p-3 bg-gray-50/80 rounded-lg border border-gray-200/60">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <button
                onClick={() => onCategorySelect('All')}
                className="hover:text-blue-600 hover:underline transition-colors"
              >
                All
              </button>
              {selectedCategory.split('/').map((part, index, array) => {
                const pathToHere = array.slice(0, index + 1).join('/');
                const isLast = index === array.length - 1;

                return (
                  <div key={index} className="flex items-center gap-1">
                    <span className="text-gray-400">/</span>
                    {isLast ? (
                      <span className="font-medium text-gray-800">{part}</span>
                    ) : (
                      <button
                        onClick={() => onCategorySelect(pathToHere)}
                        className="hover:text-blue-600 hover:underline transition-colors"
                      >
                        {part}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Tree */}
        <div className="space-y-1 max-h-80 overflow-y-auto pr-2 modern-scrollbar">
          {renderCategoryTree(categoryTree)}
        </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200/60">
        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div className="text-center p-3 bg-gray-50/80 rounded-lg">
            <div className="font-semibold text-gray-900">{stats.total}</div>
            <div className="text-gray-500">Total</div>
          </div>
          <div className="text-center p-3 bg-gray-50/80 rounded-lg">
            <div className="font-semibold text-gray-900">{stats.categories}</div>
            <div className="text-gray-500">Categories</div>
          </div>
        </div>

        {/* Utility Buttons */}
        <div className="space-y-2">
          <button
            onClick={onShowAnalytics}
            className="modern-sidebar-item w-full"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="flex-1 text-left">Analytics</span>
          </button>
          <button
            onClick={onShowImport}
            className="modern-sidebar-item w-full"
          >
            <Upload className="w-4 h-4" />
            <span className="flex-1 text-left">Import</span>
          </button>
          <button
            onClick={onShowExport}
            className="modern-sidebar-item w-full"
          >
            <Download className="w-4 h-4" />
            <span className="flex-1 text-left">Export</span>
          </button>
          <button
            onClick={onShowSettings}
            className="modern-sidebar-item w-full"
          >
            <Settings className="w-4 h-4" />
            <span className="flex-1 text-left">Settings</span>
          </button>
        </div>
      </div>

        {contextMenu.visible && (
          <div
            ref={contextMenuRef}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 bg-card border border-border rounded-md shadow-lg py-1 w-56"
          >
            {contextMenu.categoryName === CREATE_NEW_FOLDER_CONTEXT_KEY || !contextMenu.categoryName ? (
              <button
                onClick={handleCreateNewFolderFromContextMenu}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                Create New Folder
              </button>
            ) : (
              <>
                <div className="px-3 py-1.5 text-sm font-semibold text-foreground border-b border-border mb-1">
                  Actions for "{contextMenu.categoryName}"
                </div>
                <button
                  onClick={handleCreateNewFolderFromContextMenu} // Technically contextMenu.categoryName is the parent here
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  Create Subfolder
                </button>
                <button
                  onClick={handleRenameCategory}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Rename Folder
                </button>
                <button
                  onClick={handleDeleteCategoryContents}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete all in category
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Folder
                </button>
              </>
            )}
          </div>
        )}
    </div>
  );
};
