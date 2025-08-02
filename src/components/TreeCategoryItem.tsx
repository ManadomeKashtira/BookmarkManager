import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { CustomIcon, type CustomIconName } from '@/lib/customIcons';
import { IconSelectorModal } from './IconSelectorModal';
import type { Category } from '@/types/bookmark';

interface TreeCategoryItemProps {
  category: Category;
  isSelected: boolean;
  level: number;
  onSelect: (categoryPath: string) => void;
  onToggleExpansion: (categoryPath: string) => void;
  onRename?: (oldPath: string, newName: string) => void;
  onDelete?: (categoryPath: string) => void;
  onCreateSubfolder?: (parentPath: string) => void;
  onUpdateIcon?: (categoryPath: string, iconName: string) => void;
  children?: React.ReactNode;
  autoRename?: boolean;
  onAutoRenameComplete?: () => void;
  // Drag and drop props
  onDragOver?: (e: React.DragEvent, categoryPath: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, categoryPath: string) => void;
  draggedOverCategory?: string | null;
}

export const TreeCategoryItem: React.FC<TreeCategoryItemProps> = ({
  category,
  isSelected,
  level,
  onSelect,
  onToggleExpansion,
  onRename,
  onDelete,
  onCreateSubfolder,
  onUpdateIcon,
  children,
  autoRename,
  onAutoRenameComplete,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedOverCategory
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(category.icon || "folder1484");

  // Sync local icon state with category prop
  useEffect(() => {
    setCurrentIcon(category.icon || "folder1484");
  }, [category.icon]);

  const hasChildren = category.children && category.children.length > 0;
  const indentWidth = level * 16; // 16px per level for better space utilization

  const handleToggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpansion(category.fullPath || category.name);
    }
  };

  const handleSelect = () => {
    setClickCount(prev => prev + 1);

    // Handle single click - select the category
    setTimeout(() => {
      if (clickCount === 0) {
        onSelect(category.fullPath || category.name);
      }
      setClickCount(0);
    }, 300);
  };

  const handleDoubleClick = () => {
    setClickCount(0); // Reset click count
    if (hasChildren) {
      // Double click on folder with children - toggle expansion
      onToggleExpansion(category.fullPath || category.name);
    } else {
      // Double click on folder without children - select it
      onSelect(category.fullPath || category.name);
    }
  };

  const handleRename = () => {
    if (editName.trim() && editName !== category.name && onRename) {
      onRename(category.fullPath || category.name, editName.trim());
    }
    setIsEditing(false);
    setShowContextMenu(false);
    if (onAutoRenameComplete) {
      onAutoRenameComplete();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(category.name);
      setIsEditing(false);
      if (onAutoRenameComplete) {
        onAutoRenameComplete();
      }
    }
  };

  // Auto-rename effect - trigger rename mode when autoRename is true
  useEffect(() => {
    if (autoRename && !isEditing) {
      setIsEditing(true);
      setEditName(category.name);
    }
  }, [autoRename, category.name, isEditing]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(e, category.fullPath || category.name);
    }
  };

  const handleDragLeave = () => {
    if (onDragLeave) {
      onDragLeave();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop) {
      onDrop(e, category.fullPath || category.name);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(!showContextMenu);
  };

  // Handle keyboard shortcuts for context menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'F2' && !isEditing) {
      // F2 to rename
      setIsEditing(true);
      e.preventDefault();
    } else if (e.key === 'Delete' && onDelete) {
      // Delete key to delete
      onDelete(category.fullPath || category.name);
      e.preventDefault();
    } else if (e.key === 'Enter' && !isEditing) {
      // Enter to select
      onSelect(category.fullPath || category.name);
      e.preventDefault();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(category.fullPath || category.name);
    }
    setShowContextMenu(false);
  };

  const handleCreateSubfolder = () => {
    if (onCreateSubfolder) {
      onCreateSubfolder(category.fullPath || category.name);
    }
    setShowContextMenu(false);
  };

  const handleChangeIcon = () => {
    setShowIconSelector(true);
    setShowContextMenu(false);
  };

  const handleIconSelect = (iconName: CustomIconName) => {
    try {
      setCurrentIcon(iconName); // Update local state immediately
      if (onUpdateIcon) {
        onUpdateIcon(category.fullPath || category.name, iconName);
      }
      setShowIconSelector(false); // Ensure modal closes
    } catch (error) {
      console.error('Failed to update icon:', error);
    }
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 group relative ${
          draggedOverCategory === (category.fullPath || category.name)
            ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50 border-blue-200 border-dashed'
            : ''
        } ${
          isSelected
            ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${12 + indentWidth}px` }}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
      >
        {/* Tree lines and expansion toggle */}
        <div className="flex items-center mr-2">
          {hasChildren ? (
            <button
              onClick={handleToggleExpansion}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {category.isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>
          )}
        </div>

                 {/* Folder icon */}
         <div className="mr-3 flex items-center justify-center">
           <CustomIcon 
             key={`category-icon-${category.id}-${currentIcon}`}
             name={currentIcon} 
             size={16} 
             style={{ color: category.color }} 
           />
         </div>

        {/* Category name */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyPress}
              className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-medium block"
              title={category.name} // Show full name on hover
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {category.name}
            </span>
          )}
        </div>

        {/* Bookmark count */}
        {category.count > 0 && (
          <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
            {category.count}
          </span>
        )}

        {/* Context menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowContextMenu(!showContextMenu);
          }}
          className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Context menu */}
        {showContextMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[160px] max-w-[200px]">
            <button
              onClick={() => {
                setIsEditing(true);
                setShowContextMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Edit className="w-4 h-4" />
              Rename
            </button>
                         <button
               onClick={handleChangeIcon}
               className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
             >
               <CustomIcon name="gear1213" size={16} />
               Change Icon
             </button>
             <button
               onClick={handleCreateSubfolder}
               className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
             >
               <CustomIcon name="folder1484" size={16} />
               New Subfolder
             </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {category.isExpanded && children && (
        <div className="ml-4">
          {children}
        </div>
      )}

             {/* Click outside to close context menu */}
       {showContextMenu && (
         <div
           className="fixed inset-0 z-[90]"
           onClick={() => setShowContextMenu(false)}
         />
       )}

       {/* Icon Selector Modal */}
       <IconSelectorModal
         isOpen={showIconSelector}
         onClose={() => setShowIconSelector(false)}
         onSelectIcon={handleIconSelect}
         currentIcon={currentIcon}
       />
     </div>
   );
 };
