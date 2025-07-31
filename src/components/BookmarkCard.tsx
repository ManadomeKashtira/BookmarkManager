
import React, { useState } from 'react';
import { Heart, ExternalLink, Edit, Trash2, Eye } from 'lucide-react';
import type { Bookmark } from '@/types/bookmark';
import { renderLucideIcon } from '@/lib/icons';

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode: 'grid' | 'list';
  onToggleFavorite: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onVisit: (bookmark: Bookmark) => void;
  cardBackgroundClass: string;
  showDescriptions: boolean;
  showVisitCount: boolean;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  viewMode,
  onToggleFavorite,
  onEdit,
  onDelete,
  onVisit,
  cardBackgroundClass,
  showDescriptions,
  showVisitCount
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const faviconDisplay = renderLucideIcon(bookmark.favicon, {
    className: 'flex-shrink-0 text-foreground',
    size: viewMode === 'list' ? 24 : 32
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, bookmarkId: string) => {
    e.dataTransfer.setData('bookmarkId', bookmarkId);
    e.currentTarget.style.opacity = '0.6'; // Visual feedback for dragging
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1'; // Reset opacity
  };

  if (viewMode === 'list') {
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, bookmark.id)}
        onDragEnd={handleDragEnd}
        className={`group border border-border/50 rounded-xl p-4 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:border-primary/20 hover:-translate-y-1 cursor-grab ${cardBackgroundClass}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-4">
          <div className="text-2xl flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {faviconDisplay}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{bookmark.title}</h3>
              {bookmark.isFavorite && (
                <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0" />
              )}
            </div>
            {showDescriptions && bookmark.description && (
                <p className="text-sm text-muted-foreground truncate mb-2">{bookmark.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{bookmark.category}</span>
              <span>•</span>
              <span>{formatDate(bookmark.dateAdded)}</span>
              {showVisitCount && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {bookmark.visits}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex flex-wrap gap-1">
              {bookmark.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {bookmark.tags.length > 2 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                  +{bookmark.tags.length - 2}
                </span>
              )}
            </div>

            <div
              className={`flex items-center gap-1 sm:gap-2 transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <button
                title="Toggle Favorite"
                onClick={() => onToggleFavorite(bookmark.id)}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Heart className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-current text-red-500' : ''}`} />
              </button>
              <button
                title="Visit Link"
                onClick={() => onVisit(bookmark)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                title="Edit Bookmark"
                onClick={() => onEdit(bookmark)}
                className="p-2 text-muted-foreground hover:text-accent transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                title="Delete Bookmark"
                onClick={() => onDelete(bookmark.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, bookmark.id)}
      onDragEnd={handleDragEnd}
      className={`group border border-border/50 rounded-xl p-6 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/20 hover:-translate-y-2 hover:scale-105 cursor-grab ${cardBackgroundClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl flex-shrink-0 w-8 h-8 flex items-center justify-center">
          {faviconDisplay}
        </div>
        <div
          className={`flex items-center gap-1 sm:gap-2 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            title="Toggle Favorite"
            onClick={() => onToggleFavorite(bookmark.id)}
            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors hover:scale-110"
          >
            <Heart className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-current text-red-500' : ''}`} />
          </button>
          <button
            title="Visit Link"
            onClick={() => onVisit(bookmark)}
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors hover:scale-110"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            title="Edit Bookmark"
            onClick={() => onEdit(bookmark)}
            className="p-1.5 text-muted-foreground hover:text-accent transition-colors hover:scale-110"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            title="Delete Bookmark"
            onClick={() => onDelete(bookmark.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors hover:scale-110"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{bookmark.title}</h3>
        {showDescriptions && bookmark.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {bookmark.description}
            </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {bookmark.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full hover:opacity-80 transition-opacity"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full">{bookmark.category}</span>
          {showVisitCount && (
            <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {bookmark.visits}
            </span>
           )}
        </div>
        <span>{formatDate(bookmark.dateAdded)}</span>
      </div>
    </div>
  );
};
