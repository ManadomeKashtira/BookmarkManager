
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
  Folder
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
  onAddBookmark: () => void;
  onShowAnalytics: () => void;
  onShowSettings: () => void;
  onShowImport: () => void;
  onShowExport: () => void;
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
  onAddBookmark,
  onShowAnalytics,
  onShowSettings,
  onShowImport,
  onShowExport,
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
    <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 h-screen flex flex-col sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BookmarkIconLucide className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">BookmarkPro</h1>
            <p className="text-sm text-gray-500">Your Library</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
            <button
            onClick={onAddBookmark}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl py-3 px-4 font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
            >
            <Plus className="w-5 h-5" />
            Add Bookmark
            </button>
            <button
                onClick={() => {
                  onRequestCreateNewFolder();
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-3 px-4 font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2"
            >
                <FolderPlus className="w-5 h-5" />
                Create Folder
            </button>
        </div>


        <div className="space-y-1 mb-6">
          {/* Back button for subfolders */}
          {selectedCategory && !['All', 'Favorites', 'Recent'].includes(selectedCategory) && selectedCategory.includes('/') && (
            <button
              onClick={() => {
                const parentPath = selectedCategory.split('/').slice(0, -1).join('/');
                onCategorySelect(parentPath || 'All');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 mb-2"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="flex-1 text-left">Back to Parent</span>
            </button>
          )}

          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onCategorySelect(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                selectedCategory === item.id
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === item.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div
          className="mb-6"
          onContextMenu={(e) => handleContextMenuAction(e, CREATE_NEW_FOLDER_CONTEXT_KEY)} // Allow right click on general area
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-800 text-sm">Categories</h3>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          {selectedCategory && !['All', 'Favorites', 'Recent'].includes(selectedCategory) && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <button
                  onClick={() => onCategorySelect('All')}
                  className="hover:text-blue-600 hover:underline"
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
                          className="hover:text-blue-600 hover:underline"
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
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {renderCategoryTree(categoryTree)}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-gray-200 p-4 space-y-1">
          <button
            onClick={onShowAnalytics}
            className="w-full flex items-center gap-3 p-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium">Analytics</span>
          </button>
          <button
            onClick={onShowImport}
            className="w-full flex items-center gap-3 p-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200"
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">Import</span>
          </button>
          <button
            onClick={onShowExport}
            className="w-full flex items-center gap-3 p-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span className="font-medium">Export</span>
          </button>
          <button
            onClick={onShowSettings}
            className="w-full flex items-center gap-3 p-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </button>
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
