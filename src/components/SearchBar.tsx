import React from 'react';
import { Search, Grid, List, SortDesc, ChevronDown, Grid3X3 } from 'lucide-react';
import type { SortOption } from '@/types/bookmark';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedCategory: string;
  totalResults: number;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  selectedCategory,
  totalResults,
  searchInputRef
}) => {
  const sortOptions = [
    { value: 'dateAdded-desc', label: 'Date Added (Newest First)', icon: '📅' },
    { value: 'dateAdded-asc', label: 'Date Added (Oldest First)', icon: '📅' },
    { value: 'title-asc', label: 'Title (A-Z)', icon: '🔤' },
    { value: 'title-desc', label: 'Title (Z-A)', icon: '🔤' },
    { value: 'visits-desc', label: 'Most Visited', icon: '👁️' },
    { value: 'visits-asc', label: 'Least Visited', icon: '👁️' },
    { value: 'dateModified-desc', label: 'Recently Modified', icon: '✏️' },
    { value: 'dateModified-asc', label: 'Oldest Modified', icon: '✏️' },
    { value: 'favorites-first', label: 'Favorites First', icon: '⭐' },
    { value: 'favorites-last', label: 'Favorites Last', icon: '⭐' },
  ] as const;

  const currentSortOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];

  return (
    <div className="modern-search bg-white/80 backdrop-blur-sm border-b border-gray-200/60 p-6">
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="modern-search-input"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="modern-input appearance-none pr-8 cursor-pointer"
          >
            <option value="dateAdded-desc">Newest first</option>
            <option value="dateAdded-asc">Oldest first</option>
            <option value="title-asc">A-Z</option>
            <option value="title-desc">Z-A</option>
            <option value="visits-desc">Most visited</option>
            <option value="visits-asc">Least visited</option>
            <option value="favorites-first">Favorites first</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500 font-medium">
          {totalResults} {totalResults === 1 ? 'bookmark' : 'bookmarks'}
        </div>
      </div>

      {/* Selected Category Display */}
      {selectedCategory && selectedCategory !== 'All' && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">In:</span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200/50">
            {selectedCategory}
          </span>
        </div>
      )}
    </div>
  );
};
