import React from 'react';
import { Search, Grid, List, SortDesc, ChevronDown } from 'lucide-react';
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
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 p-6 sticky top-0 z-40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px] max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search bookmarks, tags, or descriptions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap flex items-center gap-1">
              <SortDesc className="w-4 h-4" />
              Sort by:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="bg-white/80 border border-gray-200/50 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 appearance-none cursor-pointer min-w-[180px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              title="Grid View"
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              title="List View"
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {selectedCategory === 'All' ? 'All Bookmarks' : selectedCategory}
          </h2>
          <p className="text-sm text-gray-600">
            {totalResults} bookmark{totalResults !== 1 ? 's' : ''} found
            {sortBy !== 'dateAdded-desc' && (
              <span className="ml-2 text-blue-600">
                • Sorted by {currentSortOption.label}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
